export const sleep = (ms: number):Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const parseBbox = (bbox: string): [number,number,number,number] => {
    const [minX, minY, maxX, maxY] = bbox.toString().split(',').map(c => parseFloat(c));
    return [minX, minY,maxX, maxY];
};

export const parseMongoBbox = (bbox: string): [[number,number],[number,number]] => {
    const [minX, minY, maxX, maxY] = parseBbox(bbox);
    return [[minX, minY],[maxX, maxY]];
};

export const parseLocation = (location: string): [number,number] => {
    const [x, y] = location.toString().split(',').map(c => parseFloat(c));
    return [x, y];
};