// AttractionCategories.ts
// Icons supported by https://reactnativeelements.com/docs/components/icon

export const AttractionCategories = [
    {
        name: 'RUINS', 
        rule: 'nwr["historic"="ruins"]; nwr["ruins"]["ruins"!="no"];nwr["building"="ruins"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'MUSEUMS', 
        rule:'nwr["tourism"="museum"];nw["tourism"="gallery"];nw["amenity"="arts_centre"];',
        icon: {
            name: 'museum',
            type: 'material',
        },
    },
    {
        name: 'ARCHAELOGICAL_SITE', 
        rule:'nwr["historic"="archaeological_site"];nwr["geological"="palaeontological_site"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'MONUMENT', 
        rule: 'nwr["historic"="monument"];',
        icon: {
            name: 'monument',
            type: 'font-awesome-5',
        },
    },  
    {
        name: 'TOURIST_ATTRACTION', 
        rule: 'nwr["tourism"="attraction"]["attraction"!="animal"]["attraction"!="maze"];nwr["tourism"="yes"];nwr["heritage"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    }, 
    {
        name: 'ARTWORK', 
        rule: 'nwr["tourism"="attraction"]["attraction"!="animal"]["attraction"!="maze"];nwr["tourism"="yes"];nwr["heritage"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'HISTORY', 
        rule: 'nwr["historic"]["historic"!~"^(castle|tower|fort|ruins|memorial|monument|archaeological_site)$"]["building"!="bunker"]["military"!="bunker"];nw["board_type"="history"]["historic"!~"^(castle|tower|fort|ruins|memorial|monument|archaeological_site)$"]["building"!="bunker"]["military"!="bunker"];nw["information"="history"]["historic"!~"^(castle|tower|fort|ruins|memorial|monument|archaeological_site)$"]["building"!="bunker"]["military"!="bunker"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'FOUNTAIN', 
        rule: 'nwr["amenity"="fountain"];nwr["playground"="splash_pad"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'MILL', 
        rule: 'nwr["man_made"="watermill"][!"ruins"];nwr["man_made"="watermill"]["ruins"="no"];nwr["man_made"="windmill"][!"ruins"];nwr["man_made"="windmill"]["ruins"="no"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'OBSERVATORY', 
        rule: 'nwr["man_made"="observatory"]["fee"];nwr["man_made"="observatory"]["fee:conditional"];nwr["amenity"="observatory"]["fee"];nwr["amenity"="observatory"]["fee:conditional"];nwr["landuse"="observatory"]["fee"];nwr["landuse"="observatory"]["fee:conditional"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'CAVE', 
        rule: 'nw["natural"="cave_entrance"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'NATURAL_MONUMENT', 
        rule: 'nw["denotation"~"^(natural_monument|landmark|religious|memorial)$"];node["natural"="tree"][religion];way["natural"="tree_row"][religion];node["natural"="tree"]["historic"];way["natural"="tree_row"]["historic"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'NATURE_PARK', 
        rule: 'nwr["leisure"="nature_reserve"];nwr["boundary"="national_park"];nwr["boundary"="protected_area"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'POND', 
        rule: 'nwr["natural"="water"]["water"~"^(pond|lake|reservoir|reflecting_pool)$"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'ROCK', 
        rule: 'nwr["natural"~"^(rock|stone)$"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'SPRING', 
        rule: 'nw["natural"="spring"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'VIEWPOINT', 
        rule: 'nwr["tourism"="viewpoint"];nw["viewpoint"="yes"];nwr["tower:type"="observation"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'WATERFALL', 
        rule: 'nwr["waterway"~"^(waterfall|dam|weir)$"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
    {
        name: 'SQUARE', 
        rule: 'nw["place"="square"];nw["leisure"="common"];way["highway"="pedestrian"]["area"="yes"];way["highway"="footway"]["area"="yes"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    },
  ];