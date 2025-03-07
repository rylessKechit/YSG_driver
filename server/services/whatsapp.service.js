// server/services/whatsapp.service.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Classe pour gérer la connexion et l'envoi de messages WhatsApp
class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCodePath = path.join(__dirname, '..', 'whatsapp-qr.png');
    this.initialize();
  }

  // Initialiser le client WhatsApp
  initialize() {
    console.log('Initialisation du service WhatsApp...');
    
    // Créer un nouveau client WhatsApp
    this.client = new Client({
        authStrategy: new LocalAuth({ clientId: "ysg-driver-app" }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

    // Événement de génération du QR code
    this.client.on('qr', (qr) => {
      console.log('QR Code reçu, veuillez le scanner avec WhatsApp sur votre téléphone');
      
      // Générer une image du QR code
      qrcode.toFile(this.qrCodePath, qr, {
        color: {
          dark: '#000',
          light: '#fff'
        }
      }, (err) => {
        if (err) {
          console.error('Erreur lors de la génération du QR code:', err);
        } else {
          console.log(`QR Code enregistré dans ${this.qrCodePath}`);
          console.log('Scannez-le avec WhatsApp pour vous connecter');
        }
      });
    });

    // Événement d'authentification
    this.client.on('authenticated', () => {
      console.log('Authentification WhatsApp réussie');
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
      
      // Supprimer le QR code une fois connecté
      if (fs.existsSync(this.qrCodePath)) {
        fs.unlinkSync(this.qrCodePath);
      }
    });

    // Initialiser le client
    this.client.initialize().catch(err => {
      console.error('Erreur lors de l\'initialisation du client WhatsApp:', err);
    });
  }

  // Méthode pour envoyer un message
  async sendMessage(phoneNumber, message) {
    console.log('DANS LA FONCTION DENVOI DE MSG')
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

  // Obtenir le chemin du QR code
  getQrCodePath() {
    return this.qrCodePath;
  }
}

// Créer une instance singleton
const whatsAppService = new WhatsAppService();

module.exports = whatsAppService;