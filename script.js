const allowedPrefixes=[
"49.32",
"106.76",
"42.106.146.0"
];

async function checkIPPermission(){

try{

const res=await fetch("https://api.ipify.org?format=json");
const data=await res.json();

const userIP=data.ip;

let allowed=false;

allowedPrefixes.forEach(prefix=>{
if(userIP.startsWith(prefix)){
allowed=true;
}
});

if(!allowed){

document.body.innerHTML=`
<div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#0d1117;color:white">
<div>
<h1>ACCESS DENIED</h1>
<p>Your IP: ${userIP}</p>
</div>
</div>
`;

}

}catch(e){}

}

checkIPPermission();


const firebaseConfig={
apiKey:"AIzaSyDFG6e6pFT265Hf7s_3s-hEUD8sN0IDoY0",
authDomain:"real-ede33.firebaseapp.com",
databaseURL:"https://real-ede33-default-rtdb.firebaseio.com",
projectId:"real-ede33",
storageBucket:"real-ede33.firebasestorage.app",
messagingSenderId:"683680941443",
appId:"1:683680941443:web:73bc1c5fcf705330ac22b6"
};

firebase.initializeApp(firebaseConfig);

const db=firebase.database();

function getBrowserId(){

let id=localStorage.getItem("tempMailBrowserId");

if(!id){

id="bid_"+Math.random().toString(36).substr(2,9)+"_"+Date.now();

localStorage.setItem("tempMailBrowserId",id);

}

return id;

}

const browserId=getBrowserId();


const generateBtn=document.getElementById("generateBtn");
const currentBox=document.getElementById("currentBox");
const otpBox=document.getElementById("otpBox");
const statusEl=document.getElementById("status");

let token=null;
let currentEmail="";
let currentPassword="";


function generateStrongPassword(){

const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

let pass="";

for(let i=0;i<10;i++){

pass+=chars.charAt(Math.floor(Math.random()*chars.length));

}

return pass;

}


async function generateEmail(){

try{

generateBtn.disabled=true;

const domRes=await fetch("https://api.mail.tm/domains");

const domData=await domRes.json();

const domain=domData["hydra:member"][0].domain;

currentEmail="user"+Math.floor(Math.random()*100000)+"@"+domain;

currentPassword=generateStrongPassword();

await fetch("https://api.mail.tm/accounts",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
address:currentEmail,
password:currentPassword
})
});

const tokenRes=await fetch("https://api.mail.tm/token",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
address:currentEmail,
password:currentPassword
})
});

const tokenData=await tokenRes.json();

token=tokenData.token;

document.getElementById("credEmail").textContent=currentEmail;

document.getElementById("credPass").textContent=currentPassword;

currentBox.style.display="block";

statusEl.textContent="Email created • waiting for OTP";

}catch(e){

statusEl.textContent="Error";

}

generateBtn.disabled=false;

}

generateBtn.onclick=generateEmail;


async function checkInbox(){

if(!token) return;

try{

const res=await fetch("https://api.mail.tm/messages",{
headers:{
Authorization:`Bearer ${token}`
}
});

const data=await res.json();

const msg=data["hydra:member"][0];

if(!msg) return;

const text=msg.intro+" "+msg.text;

const match=text.match(/\d{6}/);

if(match){

otpBox.textContent=match[0];

statusEl.textContent="OTP Received";

}

}catch(e){}

}

setInterval(checkInbox,5000);

setTimeout(()=>{

location.reload();

},15*60*1000);
