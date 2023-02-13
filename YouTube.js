const puppeteeer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");
const link = 'https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj';


let cTab;
(async function(){
    try {
        let browserOpen = puppeteeer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        })

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(link);

        await cTab.waitForSelector(".dynamic-text-container.style-scope.yt-dynamic-sizing-formatted-string");
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText},".dynamic-text-container.style-scope.yt-dynamic-sizing-formatted-string");
        // console.log(name);
        
        let allData = await cTab.evaluate(getData,".style-scope.ytd-playlist-header-renderer .ytd-playlist-byline-renderer");
        console.log(allData.noOfVideos," - ",allData.noOfViews);

        let TotalVideos = allData.noOfVideos.split(" ")[0];
        console.log(TotalVideos);

        let currentVideos = await getCVideosLength();
        console.log(currentVideos);

        // for scroll
        while(TotalVideos-currentVideos >= 20){
            await scrollToBottom();
            currentVideos = await getCVideosLength();
        }

        let finalList = await getStats();
        // console.log(finalList);

        // pdf

        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream("play.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();


    }catch (error) {
        console.log(error);
    }
    
})();




function getData(selector){
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[2].innerText;
    let noOfViews  = allElems[4].innerText;

    return{
        noOfVideos,
        noOfViews
    }
}


async function getCVideosLength(){
    let length = await cTab.evaluate(getLength,"#contents>.style-scope.ytd-playlist-video-list-renderer");
    return length;
}


function getLength(durattionSelect){
    let durattionElem = document.querySelectorAll(durattionSelect);
    return durattionElem.length;
}


async function scrollToBottom(){
    await cTab.evaluate(goToBottom);
    function goToBottom(){
        // inviled function
        // innerHeight -- scroll up to end 
        window.scrollBy(0,window.innerHeight);
    }
}

async function getStats(){
    let list = cTab.evaluate(getNameAndDuration,"h3 #video-title","#thumbnail #text");
    
    return list;
}


function getNameAndDuration(videoSelector,durationSelector){
    let videoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);
    
    let currentList = [];
    
    for(let i=0; i<durationElem.length; i++){
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({videoTitle,duration});
    }
    return currentList; 
}