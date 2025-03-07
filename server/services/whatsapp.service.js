// server/services/whatsapp.service.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration de Cloudinary (assurez-vous que ces variables sont définies dans votre .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCodeUrl = null;  // URL Cloudinary du QR code
    this.qrCodeLocalPath = path.join(os.tmpdir(), 'whatsapp-qr.png');  // Fichier temporaire
    this.publicId = `ysg-driver-app/whatsapp-qr-${Date.now()}`; // ID public unique
    this.initialize();
  }

  // Initialiser le client WhatsApp
  initialize() {
    console.log('Initialisation du service WhatsApp...');
    
    // Créer un nouveau client WhatsApp
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "ysg-driver-app" }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Événement de génération du QR code
    this.client.on('qr', async (qr) => {
      console.log('QR Code reçu, génération et téléchargement sur Cloudinary...');
      
      try {
        // Générer une image du QR code localement d'abord
        await qrcode.toFile(this.qrCodeLocalPath, qr, {
          color: {
            dark: '#000',
            light: '#fff'
          }
        });
        
        console.log(`QR Code sauvegardé localement dans ${this.qrCodeLocalPath}`);
        
        // Télécharger sur Cloudinary
        const uploadResult = await cloudinary.uploader.upload(this.qrCodeLocalPath, {
          public_id: this.publicId,
          overwrite: true,
          resource_type: 'image',
          folder: 'ysg-driver-app'
        });
        
        // Stocker l'URL du QR code
        this.qrCodeUrl = uploadResult.secure_url;
        console.log(`QR Code téléchargé sur Cloudinary: ${this.qrCodeUrl}`);
        
        // Supprimer le fichier local (optionnel)
        if (fs.existsSync(this.qrCodeLocalPath)) {
          fs.unlinkSync(this.qrCodeLocalPath);
        }
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
          .then((result) => console.log('QR Code supprimé de Cloudinary'))
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
          .then((result) => console.log('QR Code supprimé de Cloudinary'))
          .catch((err) => console.error('Erreur lors de la suppression du QR Code:', err));
        
        this.qrCodeUrl = null;
      }
    });

    // Initialiser le client
    this.client.initialize().catch(err => {
      console.error('Erreur lors de l\'initialisation du client WhatsApp:', err);
    });
  }

  // Méthode pour envoyer un message
  async sendMessage(phoneNumber, message) {
    if (!this.isReady || !this.client) {
      throw new Error('Client WhatsApp non initialisé ou non prêt');
    }
    
    try {
      // Formater le numéro de téléphone au format WhatsApp
      // Format: CountryCode + PhoneNumber + @c.us
      // Exemple: Pour +33 6 12 34 56 78, le format est 33612345678@c.us
      
      // Vérifier si le numéro est déjà formaté
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

module.exports = whatsAppService;