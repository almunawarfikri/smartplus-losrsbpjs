// ==UserScript==
// @name         Disable Klik Kolom Casemix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Mencegah klik membuka detail pasien pada kolom LOS RS, LOS BPJS dan Tarif RS
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @grant        none
// ==/UserScript==

(function(){

'use strict';

function disableKlik(){

    let th=document.querySelectorAll("#myTable thead th");

    let targetIndex=[];

    th.forEach((h,i)=>{

        let text=h.innerText.trim();

        if(
            text==="LOS RS" ||
            text==="LOS BPJS" ||
            text==="Tarif RS"
        ){
            targetIndex.push(i);
        }

    });

    if(targetIndex.length===0) return;

    let rows=document.querySelectorAll("#myTable tbody tr");

    rows.forEach(row=>{

        let cells=row.querySelectorAll("td");

        targetIndex.forEach(i=>{

            let cell=cells[i];

            if(!cell) return;

            cell.addEventListener("click", e=>e.stopPropagation());
            cell.addEventListener("mousedown", e=>e.stopPropagation());
            cell.addEventListener("dblclick", e=>e.stopPropagation());

        });

    });

}

setInterval(disableKlik,1000);

})();
