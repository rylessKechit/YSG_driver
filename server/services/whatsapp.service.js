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
  }

  // Initialiser le client WhatsApp
  async initialize() {
    console.log('Initialisation du service WhatsApp...');
    
    try {
      // Vérifier si mongoose est connecté avant de créer le store
      if (mongoose.connection.readyState !== 1) {
        console.log('Connexion MongoDB non établie, utilisation de LocalAuth');
        // Utiliser LocalAuth comme fallback
        this.client = new Client({
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        });
      } else {
        // Utiliser RemoteAuth avec MongoStore
        console.log('Connexion MongoDB établie, utilisation de RemoteAuth avec MongoStore');
        const store = new MongoStore({ mongoose: mongoose });
        
        this.client = new Client({
          authStrategy: new RemoteAuth({
            store: store,
            clientId: "ysg-driver-app",
            backupSyncIntervalMs: 300000
          }),
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        });
      }

      // Événement de génération du QR code
      this.client.on('qr', async (qr) => {
        console.log('QR Code reçu, génération et téléchargement sur Cloudinary...');
        
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
          console.log(`QR Code téléchargé sur Cloudinary: ${this.qrCodeUrl}`);
        } catch (error) {
          console.error('Erreur lors du téléchargement du QR Code:', error);
        }
      });

      // Événement d'authentification
      this.client.on('authenticated', () => {
        console.log('Authentification WhatsApp réussie');
        
        // Supprimer le QR code de Cloudinary une fois authentifié
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .then(() => console.log('QR Code supprimé de Cloudinary'))
            .catch((err) => console.error('Erreur lors de la suppression du QR Code:', err));
          
          this.qrCodeUrl = null;
        }
      });

      // Événement de déconnexion
      this.client.on('disconnected', (reason) => {
        console.log('Client WhatsApp déconnecté:', reason);
        this.isReady = false;
        
        // Tenter de se reconnecter après un délai
        setTimeout(() => {
          console.log('Tentative de reconnexion WhatsApp...');
          this.initialize();
        }, 10000);
      });

      // Événement de prêt
      this.client.on('ready', () => {
        this.isReady = true;
        console.log('Client WhatsApp prêt à envoyer des messages');
        
        // Supprimer le QR code de Cloudinary
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .then(() => console.log('QR Code supprimé de Cloudinary'))
            .catch((err) => console.error('Erreur lors de la suppression du QR Code:', err));
          
          this.qrCodeUrl = null;
        }
      });

      // Initialiser le client
      await this.client.initialize();
    } catch (err) {
      console.error('Erreur lors de l\'initialisation du client WhatsApp:', err);
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
      
      console.log(`Envoi de message WhatsApp à ${formattedNumber}`);
      
      // Envoyer le message
      const result = await this.client.sendMessage(formattedNumber, message);
      console.log('Message WhatsApp envoyé avec succès:', result.id._serialized);
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
}

// Créer une instance singleton
const whatsAppService = new WhatsAppService();

// Initialiser après l'export pour s'assurer que mongoose est connecté
setTimeout(() => {
  whatsAppService.initialize();
}, 5000);

module.exports = whatsAppService;