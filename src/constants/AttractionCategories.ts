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
        rule: 'nwr["historic"="castle"][!"ruins"];nwr["historic"="castle"]["ruins"="no"];nwr["historic"="tower"][!"ruins"];nwr["historic"="tower"]["ruins"="no"];nwr["historic"="fort"][!"ruins"];nwr["historic"="fort"]["ruins"="no"];',
        icon: {
            name: 'local-attraction',
            type: 'material',
        },
    }
  ];