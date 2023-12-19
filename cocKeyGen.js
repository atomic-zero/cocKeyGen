class Codebox4chan {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.apiKey = null;
    this.periodicCheckInterval = null;
    this.periodicallyCheckAndGenerateKey();
  }

  async getMyIp() {
    const response = await axios.get('https://api.ipify.org?format=json'); //check current ip
    return response.data.ip;
  }

  async login() {
    const url = 'https://developer.clashofclans.com/api/login';
    const headers = { 'authority': 'developer.clashofclans.com',
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
      'cookie': 'cookieconsent_status=dismiss' };
    const data = { 'email': this.email, 'password': this.password };
    const response = await axios.post(url, JSON.stringify(data), { headers });
    return response.headers['set-cookie'];
  }

async saveApiKeyToFile(apiKey, ip) {
  const filePath = path.join(__dirname, 'cocdev.json');
  let jsonData = { apiKey, ip };

  try {
    const existingData = fs.readFileSync(filePath);
    const parsedData = JSON.parse(existingData);
    jsonData = { ...parsedData, apiKey, ip }; // Update existing data with new values
  } catch (error) {
    
  }

  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
}

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

  async createKey() {
    const apiKeyFromFile = await this.loadApiKeyFromFile();
    const currentIp = await this.getMyIp();

    if (!apiKeyFromFile || apiKeyFromFile.ip !== currentIp) {
      // API key doesn't exist or IP has changed, generate a new key
      await this.deleteKey();
      const newApiKey = await this.generateApiKey(currentIp);
      this.apiKey = newApiKey;
    } else {
      // Use the existing API key
      this.apiKey = apiKeyFromFile.apiKey;
    }

    // Save the API key to file, whether it's newly generated or existing
    await this.saveApiKeyToFile(this.apiKey, currentIp);

    return this.apiKey;
  }

  async periodicallyCheckAndGenerateKey() {
    this.periodicCheckInterval = setInterval(async () => {
      const currentIp = await this.getMyIp();
      const apiKeyFromFile = await this.loadApiKeyFromFile();

      if (!apiKeyFromFile || apiKeyFromFile.ip !== currentIp) {
        await this.deleteKey();// revoke the token before generating new one
        const newApiKey = await this.generateApiKey(currentIp);
        this.apiKey = newApiKey;
        console.log("New API Key generated:", newApiKey);
      } else {
        console.log("IP matches existing API Key.");
      }
    }, 5 * 60 * 1000);// check ip every 5 minutes if the ip don't match to the current ip automatically revokes the old Key and replace with new
  }

  async generateApiKey(ip) {
    const cookie = await this.login();
    const url = 'https://developer.clashofclans.com/api/apikey/create';
    const headers = { 'authority': 'developer.clashofclans.com',
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
      'cookie': cookie };
    const randomData = crypto.randomBytes(12).toString('hex');
    const data = { "name": randomData, "description": randomData, "cidrRanges": [ip], "scopes": null };
    const response = await axios.post(url, JSON.stringify(data), { headers });
    const newApiKey = response.data.key;
    await this.saveApiKeyToFile(newApiKey, ip);
    return newApiKey;
  }

  async deleteKey() {
    const apiKeyInfo = await this.loadApiKeyFromFile();

    if (!apiKeyInfo || !apiKeyInfo.apiKey) {
      console.log('API key information not found.');
      return;
    }

    const cookie = await this.login();
    const url = 'https://developer.clashofclans.com/api/apikey/revoke';
    const headers = {    'authority': 'developer.clashofclans.com',
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
      'cookie': cookie };
    const data = { "id": apiKeyInfo.apiKey };
    const response = await axios.post(url, JSON.stringify(data), { headers });
    console.log(response.data);
  }
}

const reikodev = new Codebox4chan("example@gmail.com", "kennethpanio");// login your clash of clans developer account replace this with your email and password
reikodev.createKey().then(apiKey => console.log(apiKey)).catch(error => console.error(error));
