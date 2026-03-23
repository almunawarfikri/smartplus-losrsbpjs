// ==UserScript==
// @name         SmartPlus Diagnosa CPPT
// @namespace    http://tampermonkey.net/
// @version      7.3
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @match        http://192.168.3.16/smartplus/nurse_station/eranap*
// @match        http://103.83.178.90:38/smartplus/erm_ranap
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/diagnosacppt.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/diagnosacppt.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.16
// ==/UserScript==

(function(){

'use strict';

const CACHE_KEY="smartplus_dx_cache";


/* ================= CACHE ================= */

function loadCache(){
    try{
        return JSON.parse(localStorage.getItem(CACHE_KEY))||{};
    }catch{
        return {};
    }
}

function saveCache(data){
    localStorage.setItem(CACHE_KEY,JSON.stringify(data));
}

let cache=loadCache();


/* ================= FORMAT DIAGNOSA ================= */

function formatDiagnosa(text){

    if(!text) return text;

    // hapus <br>
    text = text.replace(/<br\s*\/?>/gi," ");

    // hapus ICD code seperti A04.9 |
    text = text.replace(/\b[A-Z]\d{1,2}(\.\d+)?\s*\|\s*/g,"");

    // hapus kata UNSPECIFIED
    text = text.replace(/,?\s*UNSPECIFIED/gi,"");

    // hapus colon
    text = text.replace(/:+/g,"");

    // hapus ;;;; di akhir
    text = text.replace(/;+\s*$/,"");

    // split diagnosa
    let parts = text.split(";");

    parts = parts.map(p=>{

        p=p.trim();

        if(!p) return null;

        // Capitalize Each Word
        p=p.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

        return p;

    }).filter(Boolean);

    return parts.join(" ; ");

}


/* ================= PERBAIKI CACHE LAMA ================= */

Object.keys(cache).forEach(k=>{
    cache[k] = formatDiagnosa(cache[k]);
});

saveCache(cache);


/* ================= AMBIL ID REG ================= */

function getIdReg(row){

    let href=row.getAttribute("data-href");

    if(!href) return null;

    let m=href.match(/([0-9]{4}[A-Z]{2}[0-9]+)/);

    return m ? m[1] : null;

}


/* ================= FETCH CPPT ================= */

function fetchCPPT(id){

    return new Promise(resolve=>{

        GM_xmlhttpRequest({

            method:"GET",

            url:`http://192.168.3.16/smartplus/nurse_station/eranap/cppt_viewer/${id}`,

            onload:r=>resolve(r.responseText),

            onerror:()=>resolve(null)

        });

    });

}


/* ================= PARSE DIAGNOSA ================= */

function parseDiagnosa(html){

    if(!html) return null;

    let parser=new DOMParser();
    let doc=parser.parseFromString(html,"text/html");

    let labels=[...doc.querySelectorAll(".col-md-3")];

    for(let label of labels){

        if(label.innerText.includes("Diagnosa Medis dan Diagnosa Banding")){

            let dxDiv=label.nextElementSibling;

            if(dxDiv){
                return dxDiv.innerText.trim();
            }

        }

    }

    return null;

}


/* ================= PROCESS ROW ================= */

async function processRow(row){

    let id=getIdReg(row);

    if(!id) return;

    let tds=row.querySelectorAll("td");

    if(tds.length<7) return;

    let diagnosaCell=tds[6];


    /* tampilkan cache dulu */

    if(cache[id]){
        diagnosaCell.innerText = cache[id];
    }


    /* fetch terbaru */

    let html=await fetchCPPT(id);

    let dx=parseDiagnosa(html);

    if(!dx) return;

    let formatted=formatDiagnosa(dx);

    if(cache[id]!==formatted){

        cache[id]=formatted;

        saveCache(cache);

        diagnosaCell.innerText=formatted;

    }

}


/* ================= RUN ================= */

function run(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    rows.forEach(processRow);

}


/* ================= INIT ================= */

setTimeout(run,1500);

})();
