const SocksProxyAgent = require('socks-proxy-agent');
// const socks = require('socks');
const fs = require('fs');
const requestPromise = require('request-promise');
// const CronJob = require('cron').CronJob;
const request = require('request');
const cron = require('node-cron');
const axios = require('axios')
const nodemailer = require('nodemailer');
const https = require('https');
// const dotenv = require('dotenv');
// const faker = require('faker');
const path = require('path');

// Initialize a transport for sending emails
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'rv9891211164@gmail.com',
      pass: 'putliverma'
    }
});

// Function to send an email with the list of not working IP addresses
function sendEmail(message) {
  const mailOptions = {
    from: 'instagramSaver@gmail.com',
    to: 'rv9891211164@gmail.com',
    subject: 'Proxy IP status report',
    text: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
}

async function getIpAddress() {
    const username = "rprrrbjd-rotate";
    const password = "eh4nrsozkbnp";
    const options = {
      url: 'http://ipv4.webshare.io/',
      proxy: 'http://'+username+':'+password+'@p.webshare.io:80'
    };
    try {
      const data = await requestPromise(options);
      return data;
    } catch (err) {
      console.error(err);
    }
  }

// Read the JSON files containing headers referers
const headersFile = fs.readFileSync('./headersList.json');
const headersList = JSON.parse(headersFile);

// Read the JSON files containing referers
const referersFile = fs.readFileSync('./referersList.json');
const referersList = JSON.parse(referersFile);

// Read the JSON files containing userAgent
const userAgentFile = fs.readFileSync('./userAgentList.json');
const userAgentList = JSON.parse(userAgentFile)

const proxyListFile = fs.readFileSync('./proxyListV2.json');
let proxyList = JSON.parse(proxyListFile);

const instagramUrlCheckListFile = fs.readFileSync('./instagramUrlCheckList.json');
const instagramUrlCheckList = JSON.parse(instagramUrlCheckListFile);

const randomUserAgent = () => {
  return userAgentList[Math.floor(Math.random() * userAgentList.length)];
};
  
const randomHeader = () => {
  return headersList[Math.floor(Math.random() * headersList.length)];
};

const randomReferer = () => {
  return referersList[Math.floor(Math.random() * referersList.length)];
};

const randomProxy = async () => {
    return filteredProxies[Math.floor(Math.random() * filteredProxies.length)];
}

const randomInstagramUrl = async () => {
    return instagramUrlCheckList[Math.floor(Math.random() * instagramUrlCheckList.length)];
}

function getRandomProtocol(proxy){
    const protocols = proxy.protocols;
    return protocols[Math.floor(Math.random() * protocols.length)];
}

// Function to add random delays between requests
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random delay between consequent requests to mimic human behavior
// const randomDelayMilis = randomDelay(500,2000);

const checkProxyStatus = async (proxy) => {
    const randomProtocol = getRandomProtocol(proxy);
    console.log("Protocol: " + randomProtocol);
    
    const agent = randomProtocol.startsWith('socks') ?
    new SocksProxyAgent.SocksProxyAgent(`${randomProtocol}://${proxy.ip}:${proxy.port}`) :
    new https.Agent({
    rejectUnauthorized: true,
    protocol: randomProtocol + ':',
    proxy: {
    protocol: randomProtocol,
    host: proxy.ip,
    port: proxy.port,
    },
    });
    
    const response = await axios.get('https://whoer.net/ip', {
    httpsAgent: agent,
    headers: {
    'User-Agent': await randomUserAgent(),
    ...(await randomHeader()),
    'Referer': await randomReferer(),
    'X-Forwarded-For':proxy.ip+':'+proxy.port
    },
    timeout: 5000,
    });
    
    console.log("Response: " + JSON.stringify(response))

    // Check if the IP address in the response matches the proxy's IP address
    if (response.data.origin === proxy.ip) {
        // The proxy is working, update the status to 'working'
        proxy.status = 'working';
        console.log(`Proxy ${proxy.ip}:${proxy.port} is working.`);
        return true;
    } else {
        // The proxy is not working, update the status to 'not working'
        proxy.status = 'not working';
        console.log(`Proxy ${proxy.ip}:${proxy.port} is not working.`);
        return false;
    }
    };

const getWorkingProxies = async () => {
    const workingProxies = [];
    for(const proxy of proxyList){
        console.log("Proxy :" + proxy.ip);
        const isWorking = await checkProxyStatus(proxy);
        if (isWorking) {
            workingProxies.push(proxy);
        }
        const min = 1000; // 1 second
        const max = 2000; // 2 seconds
        const random_Delay = randomDelay(min,max);
        await delay(random_Delay);
    }
  return workingProxies;
};
  
const filterWorkingProxies = async () => {
    const workingProxies = await getWorkingProxies();
    const filteredProxies = workingProxies.filter(proxy => proxy !== undefined);
    return filteredProxies;
}
 
// // filterWorkingProxies().then((filteredProxies) => {
// //     console.log("Filtered Working Proxies: "+filteredProxies);
// // }).catch((err) => {
//     console.error(err);
// });

// function to add random delays from 1000ms to 2000ms
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function updateProxyList() {
    console.log("Updating Proxy List...");
  // check the status of each proxy and update the list
    var workingProxies = [];
    var notWorkingProxies = [];

  proxyList.map(async (proxy) => {
    if(await checkProxyStatus(proxy)){
        workingProxies.push(proxy);
    }else{
        notWorkingProxies.push(proxy);
    }
    await delay()
  });
  console.log(notWorkingProxies);

  fs.writeFile('proxyList.json', JSON.stringify(proxyList), (err) => {
    if (err) {
      console.error('Error writing to proxyList.json', err);
    } else {
      console.log('Proxy list updated');
    }
  });

  if (notWorkingProxies.length > 0) {
    const message = `Number of working proxies: ${workingProxies.length}\n` +
                    `Number of not working proxies: ${notWorkingProxies.length}\n` +
                    `List of not working proxies: ${notWorkingProxies.map(proxy => `${proxy.ip}:${proxy.port}`).join(', ')}`;
    console.log('Sending email:', message);
    // send email here
    sendEmail(message);
  }
}

const sendRequest = async (proxy) => {
    const agent = new https.Agent({
      rejectUnauthorized: true,
      protocol: 'http',
      host: proxy.ip,
      port: proxy.port,
    });
  
    const response = await axios.get('https://httpbin.org/headers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Forwarded-For': '127.0.0.1',
      },
      httpsAgent: agent,
    });
  
    console.log(JSON.stringify(response.data.headers));
  };
  
  sendRequest({ ip: '127.0.0.1', port: 80 });


function makeRequestWithRandomHeaderAndReferer(url) {
  const randomHeader = headers[getRandomInt(0, headers.length)];
  const randomReferer = referers[getRandomInt(0, referers.length)];
  const options = {
    uri: url,
    headers: {
      'User-Agent': randomHeader.userAgent,
      'Accept-Language': randomHeader.acceptLanguage,
      Referer: randomReferer,
    },
    proxy: `http://${proxyList[getRandomInt(0, proxyList.length)].ip}:${proxyList[getRandomInt(0, proxyList.length)].port}`,
    timeout: 5000,
    resolveWithFullResponse: true,
  };
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(request(options));
    }, getRandomInt(3000, 10000));
  });
}

const makeInstagramRequest = async (instagramUrl) => {
  const proxy = randomProxy();
  const headers = {
    ...randomHeader(),
    'User-Agent': randomUserAgent(),
    Referer: randomReferer(),
  };

  const config = {
    headers,
    timeout: 5000,
    proxy: {
      host: proxy.ip,
      port: proxy.port,
    },
  };

  try {
    const response = await axios.get(instagramUrl, config);
    const instagramResponseData = response.data;
    const hasGraphql = instagramResponseData.graphql != null;
    console.log(`Response from ${instagramUrl}: `, instagramResponseData);
    console.log(`Has graphql: ${hasGraphql}`);
  } catch (error) {
    console.error(`Error making request to ${instagramUrl}: `, error);
  }
};

  
// Make a request to Instagram URL every 1 to 5 seconds with random delay
// setInterval(async () => {
//   await makeInstagramRequest();
// }, randomDelay());

// update the proxy list every 10 minutes
cron.schedule('*/10 * * * *', updateProxyList, null, true, 'America/Los_Angeles');