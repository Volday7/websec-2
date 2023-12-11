document.querySelector('#dismiss, .overlay').addEventListener('click', () => {
    document.querySelectorAll('#sidebar').forEach((block) => block.classList.remove('active'));
    document.querySelectorAll('.overlay').forEach((block) => block.classList.remove('active'));
})

document.querySelector('#sidebarCollapse').addEventListener('click', () => {
    document.querySelectorAll('#sidebar').forEach((block) => block.classList.add('active'));
    document.querySelectorAll('.overlay').forEach((block) => block.classList.add('active'));
    document.querySelectorAll('.collapse.in').forEach((block) => block.classList.toggle('in'));
    document.querySelectorAll('a[aria-expanded=true]').forEach((block) => block.classList.attributes('aria-expanded', 'false'));
})

let map;
let savedStop = []
let markers = new Map();

window.onload = function(){
    if (localStorage.getItem('savedStop'))
        savedStop = JSON.parse(localStorage.getItem('savedStop'));
    renderSavedStop()
}


DG.then(function () {
    map = DG.map('map', {
        center: [53.19, 50.13],
        zoom: 12
    });

    DG.control.ruler({position: 'bottomleft'}).addTo(map);
    DG.marker([55.76, 37.64]).addTo(map).bindPopup('html-контент');
    fetch("https://tosamara.ru/api/v2/classifiers/stopsFullDB.xml")
        .then(
            response => response.text())
        .then(str => {
                let stops = xmlToJson(new DOMParser().parseFromString(str, "application/xml"));
                stops["stops"].stop.map(stop =>{
                    const newItem = document.createElement('div');
                    newItem.className = "marker";
                    const button = document.createElement('button');
                    if(savedStop.find(find_stop => find_stop.KS_ID["#text"] === stop.KS_ID["#text"]) === undefined){
                        button.className = "saved_button"
                    }else {
                        button.className = "saved_button_select"
                    }
                    button.addEventListener("click", ()=>{
                        if(savedStop.find(find_stop => find_stop.KS_ID["#text"] === stop.KS_ID["#text"]) === undefined){
                            button.className = "saved_button_select"
                            savedStop.push(stop)
                            localStorage.setItem("savedStop", JSON.stringify(savedStop));
                            renderSavedStop()
                        }else {
                            button.className = "saved_button"
                            savedStop = savedStop.filter((item) => { return item.KS_ID["#text"] !== stop.KS_ID["#text"] });
                            localStorage.setItem("savedStop", JSON.stringify(savedStop));
                            renderSavedStop()
                        }

                    })
                    newItem.append(button)
                    const header = document.createElement('h4');
                    header.textContent = stop.title["#text"]
                    newItem.append(header)
                    const subHeader = document.createElement('p');
                    subHeader.textContent = "Остановка " + stop.adjacentStreet["#text"] +
                        " " + stop.direction["#text"]
                    newItem.append(subHeader)
                    const body = document.createElement('div');

                    newItem.append(body)
                    let marker = DG.marker([stop.latitude["#text"], stop.longitude["#text"]], {title: stop.title["#text"]}).addTo(map);
                    marker.bindPopup(newItem);
                    markers.set(stop.KS_ID["#text"], marker)
                    marker.addEventListener("popupopen", ()=>{
                        sha1(stop.KS_ID["#text"] + "just_f0r_tests").then((response)=>{
                            return response
                        })
                            .then(async (data) => {
                                return await fetch(`https://tosamara.ru/api/v2/json?method=getFirstArrivalToStop&KS_ID=${stop.KS_ID["#text"]}&os=android&clientid=test&authkey=${data}`)
                                    .then(
                                        response => response.json())
                                    .then(str => {
                                        str.arrival.map(transport => {
                                            const transInfo = document.createElement('div');
                                            transInfo.className = "trans_info";
                                            const type = document.createElement('p');
                                            type.textContent = transport.type + " " + transport.number + " "
                                            transInfo.append(type)
                                            const transStopInfo = document.createElement('select');
                                            const selectInfo = document.createElement('option');
                                            selectInfo.selected = true
                                            selectInfo.textContent = "будет через " + transport.time

                                            transStopInfo.addEventListener("click", () => {
                                                sha1(transport.hullNo + "just_f0r_tests").then((response)=>{
                                                    return response
                                                }).then(async (data) => {
                                                    return await fetch(`https://tosamara.ru/api/v2/json?method=getTransportPosition&HULLNO=${transport.hullNo}&os=android&clientid=test&authkey=${data}`)
                                                        .then(
                                                            resp => resp.json())
                                                        .then(next_str => {
                                                            next_str.nextStops.map( next =>{
                                                                const nextStop = document.createElement('option');
                                                                nextStop.textContent = stops["stops"].stop.find(stop => stop.KS_ID["#text"] === next.KS_ID ).title["#text"] +  "будет через " + Math.round(+next.time / 60)
                                                                transStopInfo.append(nextStop)
                                                            })
                                                        })
                                                })
                                            })

                                            transStopInfo.append(selectInfo)
                                            transInfo.append(transStopInfo)
                                            body.append(transInfo)
                                        })
                                    })
                            })
                    })
                })
        })
});

function renderSavedStop(){
    let list = document.querySelector('.list-unstyled');
    list.innerHTML = ''
    savedStop.map(stop => {
        const newItem = document.createElement('div');
        newItem.className = "el_list_select_stop"
        const header = document.createElement('h4');
        header.textContent = stop.title["#text"]
        newItem.append(header)
        const trans = document.createElement('p');
        trans.setAttribute('style', 'white-space: pre-line;');
        if (typeof stop.busesCommercial["#text"] !== "undefined") {
            trans.textContent += "\r\nКоммерческие автобусы " + stop.busesCommercial["#text"]
        }
        if (typeof stop.busesMunicipal["#text"] !== "undefined") {
            trans.textContent += "\r\nМуниципальные автобусы " + stop.busesMunicipal["#text"]
        }
        if (typeof stop.busesPrigorod["#text"] !== "undefined") {
            trans.textContent += "\r\nПригородные автобусы " + stop.busesPrigorod["#text"]
        }
        if (typeof stop.trams["#text"] !== "undefined") {
            trans.textContent += "\r\nТрамваи " + stop.trams["#text"]
        }
        if (typeof stop.trolleybuses["#text"] !== "undefined") {
            trans.textContent += "\r\nТроллейбусы " + stop.trolleybuses["#text"]
        }
        if(trans.textContent === ''){
            trans.textContent += "Пусто"
        }
        newItem.addEventListener('click', () => {
            map.setView([stop.latitude["#text"], stop.longitude["#text"]]);
            document.querySelectorAll('#sidebar').forEach((block) => block.classList.remove('active'));
            document.querySelectorAll('.overlay').forEach((block) => block.classList.remove('active'));
            markers.get(stop.KS_ID["#text"]).openPopup();
        });
        newItem.append(trans)
        list.append(newItem)
    })
}

function xmlToJson(xml) {
    var obj = {};
    if (xml.nodeType === 1) { // element
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // text
        obj = xml.nodeValue;
    }
    if (xml.hasChildNodes()) {
        for(var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

async function sha1(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}