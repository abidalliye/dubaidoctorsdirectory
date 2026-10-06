import {brand} from './brand';
import {publicData} from './api';
export async function getSiteBrand(){try{return (await publicData('care/public/config')).siteName||brand;}catch{return brand;}}
