import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { join } from 'path';

export function ladeTestXmlAusBasisDLM(): any {
    const xmlPath = join(process.cwd(), 'data', 'BasisDLM', 'test.xml');
    const xmlData = readFileSync(xmlPath, 'utf-8');
    
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@",
        attributesGroupName: "@attributes",
        allowBooleanAttributes: false,
        parseAttributeValue: false,
        trimValues: true,
    });
    return parser.parse(xmlData);
}



 // Allgemeine Funktion zum rekursiven Suchen nach einem beliebigen Key
export  function findObjectByKey(obj: any, searchKey: string): any {
    if (!obj || typeof obj !== 'object') return null;
    
    // Direkte Suche nach dem angegebenen Key
    if (obj[searchKey]) {
      return obj[searchKey];
    }
    
    // Rekursive Suche in allen Eigenschaften
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const searchResult = findObjectByKey(obj[key], searchKey);
        if (searchResult) return searchResult;
      }
    }
    
    return null;
  }