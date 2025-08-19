import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

interface RequiredProperties {
    key: string
    type: string
}

/**
 * Validates if an XML file is a proper AAA-DML functional file
 * @param filePath - Path to the XML file to validate
 * @returns true if the file meets all criteria, false otherwise
 */
export function getXMLFile(filePath: string): any {
    try {
        // Check if file exists and is readable
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            throw new Error(`File not found or not accessible: ${filePath}`);
        }

        // Read the file content
        const xmlContent = fs.readFileSync(filePath, 'utf-8');

        // Check for XML declaration with UTF-8 encoding
        const xmlDeclarationRegex = /<\?xml\s+version\s*=\s*["']1\.0["']\s+encoding\s*=\s*["']utf-8["']\s*\?>/i;
        if (!xmlDeclarationRegex.test(xmlContent)) {
            throw new Error(`Invalid XML declaration`);
        }        // Parse XML content
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            parseAttributeValue: true
        });
        const jsonObj = parser.parse(xmlContent);
        
        return jsonObj;

    } catch (error) {
        console.warn();
        throw new Error(`Fail to Read file ${filePath}:\n${error instanceof Error ? error.message : "failed validation check due to an unknown reason"}`);
    }
    
}


/**
 * Validates the structure of the given DML object.
 * Throws an error if the structure is invalid, otherwise returns void.
 * @param obj - The parsed XML object to validate
 */
export function validateDMLStructure(obj: any,filePath:string): void {
    try {
         validateObject(
            "The Document",
            obj,
            [
                { key: 'AX_Bestandsdatenauszug', type: 'object' },
                { key: '?xml', type: 'any' },
            ]
        );


        validateObject(
            "AX_Bestandsdatenauszug",
            obj.AX_Bestandsdatenauszug,
            [
                { key: 'erfolgreich', type: 'boolean' },
                { key: 'antragsnummer', type: 'number' },
                { key: 'allgemeineAngaben', type: 'object' },
                { key: 'erlaeuterung', type: 'string' },
                { key: 'koordinatenangaben', type: 'object' },
                { key: 'enthaelt', type: 'object' },
                { key: '@_xmlns:ogc', type: 'string' },
                { key: '@_xmlns:gml', type: 'string' },
                { key: '@_xmlns:xlink', type: 'string' },
                { key: '@_xmlns:wfs', type: 'string' },
                { key: '@_xmlns:gts', type: 'string' },
                { key: '@_xmlns:gmd', type: 'string' },
                { key: '@_xmlns:fes', type: 'string' },
                { key: '@_xmlns:xs', type: 'string' },
                { key: '@_xmlns:gsr', type: 'string' },
                { key: '@_xmlns:ak', type: 'string' },
                { key: '@_xmlns:xsi', type: 'string' },
                { key: '@_xmlns:fc', type: 'string' },
                { key: '@_xmlns:ows', type: 'string' },
                { key: '@_xmlns:gco', type: 'string' },
                { key: '@_xmlns:gss', type: 'string' },
                { key: '@_xmlns', type: 'string' }
            ]
        );validateObject(
            "AX_Bestandsdatenauszug.enthaelt",
            obj.AX_Bestandsdatenauszug.enthaelt,
            [
                { key: 'wfs:FeatureCollection', type: "any" }
            ]
        );    } catch (error) {

        throw new Error(`Failed to validate file ${filePath}:\n${error instanceof Error ? error.message : "failed validation check due to an unknown reason"}`);
        
    }

}


function validateObject(ObjectName: string, obj: any, requiredProperties: RequiredProperties[]): void {
    try {
        if (typeof obj !== "object" || obj === null) throw new Error(`is null or undefined`)
        requiredProperties.map((v) => {
            if (!obj.hasOwnProperty(v.key)) throw new Error(`does not contain property '${v.key}'`)
            if (v.type !== "any" && typeof obj[v.key] !== v.type) throw new Error(`the property '${v.key}' is not of type ${v.type}`);
        })
        return

    } catch (error) {

        throw new Error(`'${ObjectName}' ${error instanceof Error ? error.message : "failed validation check due to an unknown reason"}`)
    }
}


