// Allow for variables in the css 
var cssclass = document.querySelector(":root");
var mystyle = window.getComputedStyle(cssclass);

const filterGroup = document.getElementById('filter-group');

mapboxgl.accessToken = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNscGkxOHVvbjA2eW8ybG80NDJ3ajBtMWwifQ.L2qe-aJO35nls3sfd0WKPA';
 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    // style: 'mapbox://styles/mapbox/streets-v12', // style URL
    style: 'mapbox://styles/ptrszkwcz/clq2frznh00cp01qmb1vce1kl',
    center: [-114.64222994003272, 33.55], // starting position [lng, lat]
    zoom: 10.3 // starting zoom
});

// Dont forget this part for Hover!
let hoveredPolygonId = null;
let clickedPolygonId = null;

const cats = ['C','F','G','I','P','T'];
const cat_labels = ['Citrus','Field Crops','Grain','Idle','Prarie Crops','Truck Crops & Berries'];
var filter_cats = [];

map.on('load', () => {

    map.addSource('source-A', {
        'type': 'vector',
        'url': "mapbox://ptrszkwcz.4j722bsj",
        'promoteId':'UniqueID' // Because mapbox fucks up when assigning IDs, make own IDs in QGIS and then set here!!!
    });

    map.addLayer({
        'id': 'A-PrimStyle',
        'type': 'fill',
        'source': 'source-A', 
        'source-layer':'PaloVerde_final-3lrrgz',
        'layout': {},
        'paint': {
            'fill-color': [ 'match', ['get','SYMB_CLASS'],
                'C', '#efee3e',
                'F', '#6abbc2',
                'G', '#4ff08b',
                'I', '#dbd1d1',
                'P', '#a6ff96',
                'T', '#23c79a',
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


    // CLICK TO FILTER (STAND ALONE) ---------------------------------------------------------------
    for (let i = 0; i < cats.length; i++) {

        const symbol = cats[i]
        const symbol_label = cat_labels[i]
        const layerID = `${symbol}`;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = layerID;
        input.checked = true;
        filterGroup.appendChild(input);

        const label = document.createElement('label');
        label.setAttribute('for', layerID);
        label.textContent = symbol_label;
        filterGroup.appendChild(label);

        console.log(filterGroup)

        input.addEventListener('change', (e) => {
            filter_select = e.target.id
            console.log(filter_select)

            if (filter_cats.includes(filter_select)){

                const del_index = filter_cats.indexOf(filter_select);
                const new_filter =filter_cats.splice(del_index, 1);
            }
            else{
                const new_filter = filter_cats.push(filter_select)
            }

            if (filter_cats.length > 0){
                map.setFilter('A-PrimStyle', ['match', ['get', 'SYMB_CLASS'], filter_cats,false,true]);
            }
            else{
                map.setFilter('A-PrimStyle', null)
            }
        });
    }


});