// server/services/whatsapp.service.js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCodeUrl = null;
    this.publicId = `ysg-driver-app/whatsapp-qr-${Date.now()}`;
    this.qrGenerationInProgress = false;
    this.lastQRGeneration = 0;
    this.qrRefreshInterval = 60000; // Limite à une génération par minute
    this.isInitializing = false;
  }

  // Initialiser le client WhatsApp
  async initialize() {
    // Éviter les initialisations multiples
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    
    try {
      // Vérifier si nous avons déjà un client fonctionnel
      if (this.client && this.isReady) {
        this.isInitializing = false;
        return;
      }

      // Vérifier si mongoose est connecté avant de créer le store
      if (mongoose.connection.readyState !== 1) {
        // Utiliser LocalAuth comme fallback
        this.client = new Client({
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // Réduire la consommation de ressources
            defaultViewport: { width: 800, height: 600 }
          }
        });
      } else {
        // Utiliser RemoteAuth avec MongoStore
        
        try {
          const store = new MongoStore({ mongoose: mongoose });
          
          this.client = new Client({
            authStrategy: new RemoteAuth({
              store: store,
              clientId: "ysg-driver-app",
              backupSyncIntervalMs: 300000
            }),
            puppeteer: {
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
              defaultViewport: { width: 800, height: 600 }
            }
          });
        } catch (error) {
          console.error('Erreur lors de la création du MongoStore:', error);
          // Fallback vers méthode plus simple sans MongoStore
          this.client = new Client({
            puppeteer: {
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
              defaultViewport: { width: 800, height: 600 }
            }
          });
        }
      }

      // Événement de génération du QR code
      this.client.on('qr', async (qr) => {
        // Vérifier s'il faut générer un nouveau QR code
        const currentTime = Date.now();
        if (this.qrGenerationInProgress || (currentTime - this.lastQRGeneration < this.qrRefreshInterval)) {
          return;
        }
        
        this.qrGenerationInProgress = true;
        this.lastQRGeneration = currentTime;
        
        try {
          // Générer une image du QR code
          const qrBuffer = await qrcode.toBuffer(qr);
          
          // Télécharger sur Cloudinary en utilisant upload_stream
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                public_id: this.publicId,
                overwrite: true
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(qrBuffer);
          });
          
          this.qrCodeUrl = uploadResult.secure_url;
        } catch (error) {
          console.error('Erreur lors du téléchargement du QR Code:', error);
        } finally {
          this.qrGenerationInProgress = false;
        }
      });

      // Événement d'authentification
      this.client.on('authenticated', () => {
        
        // Supprimer le QR code de Cloudinary une fois authentifié
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .catch((err) => console.error('Erreur lors de la suppression du QR Code:', err));
          
          this.qrCodeUrl = null;
        }
      });

      // Événement de déconnexion
      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        this.qrCodeUrl = null;
        
        // Attendre avant de tenter de se reconnecter
        setTimeout(() => {
          if (!this.isInitializing && !this.isReady) {
            this.initialize();
          }
        }, 30000); // 30 secondes de délai avant reconnexion
      });

      // Événement de prêt
      this.client.on('ready', () => {
        this.isReady = true;
        
        // Supprimer le QR code de Cloudinary
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .catch((err) => console.error('Erreur lors de la suppression du QR Code:', err));
          
          this.qrCodeUrl = null;
        }
      });

      // Gestion des erreurs
      this.client.on('auth_failure', (msg) => {
        console.error('Erreur d\'authentification WhatsApp:', msg);
        this.isReady = false;
      });

      // Initialiser le client avec gestion d'erreur
      try {
        await this.client.initialize();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du client WhatsApp:', error);
        // Réinitialiser l'état pour permettre de futures tentatives
        this.client = null;
        this.isReady = false;
      }
    } catch (err) {
      console.error('Erreur globale lors de l\'initialisation du client WhatsApp:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  // Méthode pour envoyer un message
  async sendMessage(phoneNumber, message) {
    if (!this.isReady || !this.client) {
      throw new Error('Client WhatsApp non initialisé ou non prêt');
    }
    
    try {
      // Formater le numéro de téléphone au format WhatsApp
      let formattedNumber = phoneNumber;
      
      // Enlever les caractères non numériques sauf le +
      formattedNumber = formattedNumber.replace(/[^\d+]/g, '');
      
      // Enlever le + si présent
      if (formattedNumber.startsWith('+')) {
        formattedNumber = formattedNumber.substring(1);
      }
      
      // Enlever le 0 initial pour les numéros français
      if (formattedNumber.startsWith('330')) {
        formattedNumber = '33' + formattedNumber.substring(3);
      } else if (formattedNumber.startsWith('0')) {
        formattedNumber = '33' + formattedNumber.substring(1);
      } else if (!formattedNumber.startsWith('33')) {
        // Si le numéro ne commence pas par 33, on suppose qu'il est français
        formattedNumber = '33' + formattedNumber;
      }
      
      // Ajouter le suffixe WhatsApp
      formattedNumber = `${formattedNumber}@c.us`;
      
      // Envoyer le message
      const result = await this.client.sendMessage(formattedNumber, message);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
      throw error;
    }
  }
  
  // Vérifier si le client est prêt
  isClientReady() {
    return this.isReady;
  }

  // Obtenir l'URL du QR code sur Cloudinary
  getQrCodeUrl() {
    return this.qrCodeUrl;
  }

  // Méthode pour déconnecter WhatsApp
  async disconnect() {
    try {
      if (!this.client || !this.isReady) {
        return false;
      }
      
      // Déconnecter le client WhatsApp
      await this.client.logout();
      
      // Réinitialiser l'état
      this.isReady = false;
      this.qrCodeUrl = null;

      setTimeout(() => {
        whatsAppService.initialize();
      }, 15000);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion du client WhatsApp:', error);
      return false;
    }
  }
}

// Créer une instance singleton
const whatsAppService = new WhatsAppService();

// Initialiser après l'export pour s'assurer que mongoose est connecté
// Délai plus long pour permettre à MongoDB de se connecter d'abord
setTimeout(() => {
  whatsAppService.initialize();
}, 15000); // Attendre 15 secondes au lieu de 5

module.exports = whatsAppService;