// server/services/whatsapp.service.js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

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
    this.qrRefreshInterval = 60000;
    this.isInitializing = false;
  }

  async initialize() {
    if (this.isInitializing) return;
    this.isInitializing = true;
    
    try {
      if (this.client && this.isReady) {
        this.isInitializing = false;
        return;
      }

      const clientOptions = {
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: { width: 800, height: 600 }
        }
      };

      if (mongoose.connection.readyState === 1) {
        try {
          const store = new MongoStore({ mongoose });
          clientOptions.authStrategy = new RemoteAuth({
            store,
            clientId: "ysg-driver-app",
            backupSyncIntervalMs: 300000
          });
        } catch (error) {
          console.error('Erreur lors de la création du MongoStore:', error);
        }
      }

      this.client = new Client(clientOptions);

      this.client.on('qr', async (qr) => {
        const currentTime = Date.now();
        if (this.qrGenerationInProgress || (currentTime - this.lastQRGeneration < this.qrRefreshInterval)) return;
        
        this.qrGenerationInProgress = true;
        this.lastQRGeneration = currentTime;
        
        try {
          const qrBuffer = await qrcode.toBuffer(qr);
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { public_id: this.publicId, overwrite: true },
              (error, result) => error ? reject(error) : resolve(result)
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

      this.client.on('authenticated', () => {
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .catch(err => console.error('Erreur lors de la suppression du QR Code:', err));
          this.qrCodeUrl = null;
        }
      });

      this.client.on('disconnected', () => {
        this.isReady = false;
        this.qrCodeUrl = null;
        setTimeout(() => {
          if (!this.isInitializing && !this.isReady) this.initialize();
        }, 30000);
      });

      this.client.on('ready', () => {
        this.isReady = true;
        if (this.qrCodeUrl) {
          cloudinary.uploader.destroy(this.publicId)
            .catch(err => console.error('Erreur lors de la suppression du QR Code:', err));
          this.qrCodeUrl = null;
        }
      });

      this.client.on('auth_failure', msg => {
        console.error('Erreur d\'authentification WhatsApp:', msg);
        this.isReady = false;
      });

      await this.client.initialize();
    } catch (err) {
      console.error('Erreur globale lors de l\'initialisation du client WhatsApp:', err);
      this.client = null;
      this.isReady = false;
    } finally {
      this.isInitializing = false;
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isReady || !this.client) {
      throw new Error('Client WhatsApp non initialisé ou non prêt');
    }
    
    try {
      // Formater le numéro de téléphone
      let formattedNumber = phoneNumber.replace(/[^\d+]/g, '');
      if (formattedNumber.startsWith('+')) formattedNumber = formattedNumber.substring(1);
      if (formattedNumber.startsWith('330')) formattedNumber = '33' + formattedNumber.substring(3);
      else if (formattedNumber.startsWith('0')) formattedNumber = '33' + formattedNumber.substring(1);
      else if (!formattedNumber.startsWith('33')) formattedNumber = '33' + formattedNumber;
      
      formattedNumber = `${formattedNumber}@c.us`;
      return await this.client.sendMessage(formattedNumber, message);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
      throw error;
    }
  }
  
  isClientReady() {
    return this.isReady;
  }

  getQrCodeUrl() {
    return this.qrCodeUrl;
  }

  async disconnect() {
    try {
      if (!this.client || !this.isReady) return false;
      
      await this.client.logout();
      this.isReady = false;
      this.qrCodeUrl = null;

      setTimeout(() => whatsAppService.initialize(), 15000);
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion du client WhatsApp:', error);
      return false;
    }
  }
}

const whatsAppService = new WhatsAppService();
setTimeout(() => whatsAppService.initialize(), 15000);

module.exports = whatsAppService;