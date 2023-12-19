const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Codebox4chan {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.apiKey = null;
    this.periodicCheckInterval = null;
    this.periodicallyCheckAndGenerateKey();
  }

  // Fetch the current IP address
  async getMyIp() {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error.message);
      throw error;
    }
  }

  // Perform login and return the session cookie
  async login() {
    const url = 'https://developer.clashofclans.com/api/login';
    const headers = this.getCommonHeaders();
    const data = { 'email': this.email, 'password': this.password };

    try {
      const response = await axios.post(url, JSON.stringify(data), { headers });
      return response.headers['set-cookie'];
    } catch (error) {
      console.error('Error during login:', error.message);
      throw error;
    }
  }

  // Save API key and IP to a JSON file
  async saveApiKeyToFile(apiKey, ip) {
    const filePath = path.join(__dirname, 'cocdev.json');
    let jsonData = { apiKey, ip };

    try {
      const existingData = fs.readFileSync(filePath);
      const parsedData = JSON.parse(existingData);
      jsonData = { ...parsedData, apiKey, ip };
    } catch (error) {
      // File does not exist or is not valid JSON
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  }

  // Load API key and IP from the JSON file
  async loadApiKeyFromFile() {
    const filePath = path.join(__dirname, 'cocdev.json');

    try {
      const rawData = fs.readFileSync(filePath);
      const jsonData = JSON.parse(rawData);
      return jsonData || null;
    } catch (error) {
      return null;
    }
  }

  // Create or retrieve the API key
  async createKey() {
    const apiKeyFromFile = await this.loadApiKeyFromFile();
    const currentIp = await this.getMyIp();

    if (!apiKeyFromFile || apiKeyFromFile.ip !== currentIp) {
      await this.deleteKey();
      const newApiKey = await this.generateApiKey(currentIp);
      this.apiKey = newApiKey;
    } else {
      this.apiKey = apiKeyFromFile.apiKey;
    }

    await this.saveApiKeyToFile(this.apiKey, currentIp);

    return this.apiKey;
  }

  // Periodically check and generate a new key if IP has changed
  async periodicallyCheckAndGenerateKey() {
    this.periodicCheckInterval = setInterval(async () => {
      const currentIp = await this.getMyIp();
      const apiKeyFromFile = await this.loadApiKeyFromFile();

      if (!apiKeyFromFile || apiKeyFromFile.ip !== currentIp) {
        await this.deleteKey();
        const newApiKey = await this.generateApiKey(currentIp);
        this.apiKey = newApiKey;
        console.log("New API Key generated:", newApiKey);
      } else {
        console.log("IP matches existing API Key.");
      }
    }, 5 * 60 * 1000);
  }

  // Generate a new API key
  async generateApiKey(ip) {
    const cookie = await this.login();
    const url = 'https://developer.clashofclans.com/api/apikey/create';
    const headers = this.getCommonHeaders();
    const randomData = crypto.randomBytes(12).toString('hex');
    const data = { "name": randomData, "description": randomData, "cidrRanges": [ip], "scopes": null };

    try {
      const response = await axios.post(url, JSON.stringify(data), { headers });
      const newApiKey = response.data.key;
      await this.saveApiKeyToFile(newApiKey, ip);
      return newApiKey;
    } catch (error) {
      console.error('Error generating API key:', error.message);
      throw error;
    }
  }

  // Revoke the existing API key
  async deleteKey() {
    const apiKeyInfo = await this.loadApiKeyFromFile();

    if (!apiKeyInfo || !apiKeyInfo.apiKey) {
      console.log('API key information not found.');
      return;
    }

    const cookie = await this.login();
    const url = 'https://developer.clashofclans.com/api/apikey/revoke';
    const headers = this.getCommonHeaders();
    const data = { "id": apiKeyInfo.apiKey };

    try {
      const response = await axios.post(url, JSON.stringify(data), { headers });
      console.log(response.data);
    } catch (error) {
      console.error('Error revoking API key:', error.message);
      throw error;
    }
  }

  // Helper function to get common HTTP headers
  getCommonHeaders() {
    return {
      'authority': 'developer.clashofclans.com',
      'accept': '*/*',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'content-type': 'application/json',
      'sec-gpc': '1',
      'origin': 'https://developer.clashofclans.com',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://developer.clashofclans.com/',
      'accept-language': 'en-US,en;q=0.9',
      // 'cookie': cookie // Avoid including the cookie in common headers
    };
  }
}

// Usage example
const reikodev = new Codebox4chan("example@gmail.com", "kennethpanio");//replace this with your own email and password
reikodev.createKey().then(apiKey => console.log(apiKey)).catch(error => console.error(error));

/*
░█████╗░░█████╗░██████╗░███████╗██████╗░░█████╗░██╗░░██╗  ░█████╗░██╗░░██╗░█████╗░███╗░░██╗
██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗██╔╝  ██╔══██╗██║░░██║██╔══██╗████╗░██║
██║░░╚═╝██║░░██║██║░░██║█████╗░░██████╦╝██║░░██║░╚███╔╝  ░██║░░╚═╝███████║███████║██╔██╗██║
██║░░██╗██║░░██║██║░░██║██╔══╝░░██╔══██╗██║░░██║░██╔██╗  ░██║░░██╗██╔══██║██╔══██║██║╚████║
╚█████╔╝╚█████╔╝██████╔╝███████╗██████╦╝╚█████╔╝██╔╝╚██╗  ╚█████╔╝██║░░██║██║░░██║██║░╚███║
░╚════╝░░╚════╝░╚═════╝░╚══════╝╚═════╝░░╚════╝░╚═╝░░╚═╝4░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝

  Codebox4chan - Open Source Clash of Clans Developer API Key Generator
  Author: codebox4chan
  GitHub: https://github.com/codebox4chan
  License: MIT License
*/
        
