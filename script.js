// Allow for variables in the css 
var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

const filterGroup = document.getElementById('filter-group');

mapboxgl.accessToken = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNtOHMwbmJvdTA4ZnIya290M2hlbmswb2YifQ.qQZEM9FzU2J-_z0vYoSBeg';
 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    // style: 'mapbox://styles/mapbox/streets-v12', // style URL
    style: 'mapbox://styles/ptrszkwcz/clq2frznh00cp01qmb1vce1kl',
    center: [-114.61, 33.62], // starting position [lng, lat]
    zoom: 10.5, // starting zoom
    bearing: 90
});

// Dont forget this part for Hover!
let hoveredPolygonId = null;
let clickedPolygonId = null;

// const cats = ['Citrus','Field Crops','Grain','Idle','Prarie Crops','Truck Crops & Berries'];
const cats = ['C','F','G','I','P','T'];

// const cat_labels = ['Citrus','Field Crops','Grain','Idle','Prarie Crops','Truck Crops & Berries'];
var filter_cats = [];

map.on('load', () => {

    map.addSource('source-A', {
        'type': 'vector',
        'url': "mapbox://ptrszkwcz.4j722bsj",
        'promoteId':'UniqueID' // Because mapbox fucks up when assigning IDs, make own IDs in QGIS and then set here!!!
    });

    map.addSource('source-B', {
        'type': 'vector',
        'url': "mapbox://ptrszkwcz.cm47ssh8y076v1poc72s9cx5i-988dl",
    });

    map.addLayer({
        'id': 'B-River',
        'type': 'line',
        'source': 'source-B', 
        'source-layer':'ColoradoRiver_update',
        'layout': {
            'line-cap': 'round',
        },
        'paint': {
            'line-blur': 2,
            'line-color': '#7de0ff',
            'line-opacity': 0.7,
            'line-width': 7,
            },
    })

    map.addLayer({
        'id': 'A-PrimStyle',
        'type': 'fill',
        'source': 'source-A', 
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'fill-color': [ 'match', ['get','SYMB_CLASS'],
                'C', '#ff911c',
                'F', '#2fbf7a',
                'G', '#efee3e',
                'I', '#ffffff',
                // 'I', '#dbd1d1',
                'P', '#c0fcb6',
                'T', '#c099ff',
                '#000000'
                ], 
                'fill-opacity': 0.75,
            },
        'filer_bool': true,
    });


    //HIHGLIGHT ON HOVER ---------------------------------------------------------------
    map.addLayer({
        'id': 'A-Hover-line',
        'type': 'line',
        'source': 'source-A', // reference the data source
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'line-color': [ 'case', 
                ['boolean', ['feature-state', 'hover'], false], mystyle.getPropertyValue("--highl_color"), '#636363'],
            'line-width': [ 'case', 
                ['boolean', ['feature-state', 'hover'], false], 2.5, 0.25],
        }
    }); 

    map.addLayer({
        'id': 'A-Hover-fill',
        'type': 'fill',
        'source': 'source-A', // reference the data source
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'fill-color': mystyle.getPropertyValue("--highl_color"),
            'fill-opacity': [ 'case', 
                ['boolean', ['feature-state', 'hover'], false], 0.5, 0],
        }
    }); 


    //HIHGLIGHT ON CLICK ---------------------------------------------------------------
    map.addLayer({
        'id': 'A-Click-line',
        'type': 'line',
        'source': 'source-A', // reference the data source
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'line-color': [ 'case', 
                ['boolean', ['feature-state', 'click'], false], mystyle.getPropertyValue("--highl_color"), '#636363'],
            'line-width': [ 'case', 
                ['boolean', ['feature-state', 'click'], false], 4, 0.25],
        }
    }); 

    map.addLayer({
        'id': 'A-Click-fill',
        'type': 'fill',
        'source': 'source-A', // reference the data source
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'fill-color': mystyle.getPropertyValue("--highl_color"),
            'fill-opacity': [ 'case', 
                ['boolean', ['feature-state', 'click'], false], 0.5, 0],
        }
    }); 


    // POPUP ON CLICK ---------------------------------------------------------------
    const popup = new mapboxgl.Popup({
        closeButton: false,
    });

    // this function finds the center of a feature (to set popup) 
    function getFeatureCenter(feature) {
        let center = [];
        let latitude = 0;
        let longitude = 0;
        let height = 0;
        let coordinates = [];
        feature.geometry.coordinates.forEach(function (c) {
            let dupe = [];
            if (feature.geometry.type === "MultiPolygon")
                dupe.push(...c[0]); //deep clone to avoid modifying the original array
            else 
                dupe.push(...c); //deep clone to avoid modifying the original array
            dupe.splice(-1, 1); //features in mapbox repeat the first coordinates at the end. We remove it.
            coordinates = coordinates.concat(dupe);
        });
        if (feature.geometry.type === "Point") {
            center = coordinates[0];
        }
        else {
            coordinates.forEach(function (c) {
                latitude += c[0];
                longitude += c[1];
            });
            center = [latitude / coordinates.length, longitude / coordinates.length];
        }

        return center;
    }

    map.on('click', 'A-PrimStyle', (e) => {
        new mapboxgl.Popup()
        feature = e.features[0]
        let acreage_long = feature.properties.ACRES
        let acreage = acreage_long.toFixed(2)
        popup.setLngLat(getFeatureCenter(feature))
        // popup.setLngLat(e.lngLat)
        .setHTML(`<poptit>
                    Farm ID: ${feature.properties.UniqueID}
                    </poptit>
                <div class = "pop-lines"></div>
                <div class = "pop-session">
                  <left>Crop</left><right>${feature.properties.crop_name}</right>
                </div>
                <div class = "pop-session">
                    <left>Acreage</left><right>${acreage}</right>
                </div>
                <div class = "pop-session">
                    <left>Plantings</left><right>${feature.properties.Multi}</right>
                </div>
                  `)
        .addTo(map);
    });
    
    // HIGHLIGHT ON CLICK BOOLEAN ---------------------------------------------------------------
    map.on('click', 'A-PrimStyle', (e) => {
        if (e.features.length > 0) {
            if (clickedPolygonId !== null) {
                map.setFeatureState(
                    { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: clickedPolygonId },
                    { click: false }
                    );
            }

            clickedPolygonId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: clickedPolygonId },
                { click: true }
            );
        } 
    });
    
    // POPUP CLOSE ON CLICK --------------------------------------------------------------- 
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point);
        // console.log(features)
        if (features.length == 0) {
            map.setFeatureState(
                    { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: clickedPolygonId },
                    { click: false }
                );
        }
    }); 


    // CHANGE HOUSE APPEARANCE --------------------------------------------------------------- 
    map.on('mouseenter', 'A-PrimStyle', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'A-PrimStyle', () => {
        map.getCanvas().style.cursor = '';
    });


    // HIGHLIGHT ON HOVER BOOLEAN --------------------------------------------------------------- 
    map.on('mousemove', 'A-PrimStyle', (e) => {
        if (e.features.length > 0) {

            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: hoveredPolygonId },
                    { hover: false }
                    );
            }

            hoveredPolygonId = e.features[0].id;
            // hoveredPolygonId = e.features[0].properties.featID;

            map.setFeatureState(
                { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: hoveredPolygonId },
                { hover: true }
            );
        }
    });
        
    // When the mouse leaves the state-fill layer, update the feature state of the
    map.on('mouseleave', 'A-PrimStyle', () => {
        if (hoveredPolygonId !== null) {
            map.setFeatureState(
                { source: 'source-A', sourceLayer: 'PaloVerde_final-3lrrgz', id: hoveredPolygonId },
                { hover: false }
            );
        }
        hoveredPolygonId = null;
    });

    // CLICK TO FILTER (INTEGRATED INTO LEGEND) ---------------------------------------------------------------

    for (let i = 0; i < cats.length; i++) {

        const hash = "#"
        const ID_name = hash.concat(cats[i])

        const sessionDiv = document.querySelector(ID_name);

        // console.log(sessionDiv)

        sessionDiv.addEventListener('click', (e) => {

            let parent_element = sessionDiv.parentElement.parentElement
            filter_select = e.target.id

            if (filter_cats.includes(filter_select)){
                const del_index = filter_cats.indexOf(filter_select);
                const new_filter = filter_cats.splice(del_index, 1);
                sessionDiv.classList.add("active");
                parent_element.classList.add("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.add("active");
            }
            else{
                const new_filter = filter_cats.push(filter_select)
                sessionDiv.checked = false;
                sessionDiv.classList.remove("active");
                parent_element.classList.remove("active")
                let ID_symbol = cats[i].concat("_symbol")
                document.getElementById(ID_symbol).classList.remove("active");
            }

            console.log(filter_cats)

            if (filter_cats.length > 0){
                map.setFilter('A-PrimStyle', ['match', ['get', 'SYMB_CLASS'], filter_cats,false,true]);
            }
            else{
                map.setFilter('A-PrimStyle', null)
            }
        });
    }

    // // CLICK TO FILTER (INTEGRATED INTO LEGEND) ---------------------------------------------------------------
    // for (let i = 0; i < cats.length; i++) {

    //     const hash = "#"
    //     const ID_name = hash.concat(cats[i])
    //     console.log(ID_name)

    //     const sessionDiv = document.querySelector(ID_name);

    //     console.log(sessionDiv)

    //     sessionDiv.addEventListener('click', (e) => {
    //         // console.log(e.srcElement)
    //         filter_select = e.target.id
    //         console.log(filter_select)

    //         if (filter_cats.includes(filter_select)){

    //             const del_index = filter_cats.indexOf(filter_select);
    //             const new_filter =filter_cats.splice(del_index, 1);
    //             sessionDiv.classList.add("checked");
                
    //         }
    //         else{
    //             const new_filter = filter_cats.push(filter_select)
    //             sessionDiv.checked = false;
    //             sessionDiv.classList.remove("checked");
    //         }

    //         if (filter_cats.length > 0){
    //             map.setFilter('A-PrimStyle', ['match', ['get', 'SYMB_CLASS'], filter_cats,false,true]);
    //         }
    //         else{
    //             map.setFilter('A-PrimStyle', null)
    //         }
    //     });
    // }


});