const axios = require('axios');
const {parseStringPromise} = require('xml2js')

const SPARQL_ENDPOINT = 'http://35.223.96.137:9999/blazegraph/namespace/tras/sparql';

/**
 * Queries the SPARQL endpoint for traffic sign information.
 * @param {string} trafficSignClass - The class of the detected traffic sign
 * @returns {object|null} - An object containing details about the traffic sign or null if not found
 */
const getTrafficSignDetails = async (trafficSignClass) => {
    try {
        const sparqlQuery = `
            PREFIX tras: <http://example.com/tras#>
            SELECT ?description ?regulationDescription ?adviceDescription ?contextDescription
            WHERE {
                tras:${trafficSignClass} tras:description ?description .
                OPTIONAL {
                    tras:${trafficSignClass} tras:isRegulatedBy ?regulation .
                    ?regulation tras:description ?regulationDescription .
                }
                OPTIONAL {
                    tras:${trafficSignClass} tras:offersAdvice ?advice .
                    ?advice tras:description ?adviceDescription .
                }
                OPTIONAL {
                    tras:${trafficSignClass} tras:hasContext ?context .
                    ?context tras:description ?contextDescription .
                }
            }
        `;

        const response = await axios.post(SPARQL_ENDPOINT, null, {
            params: {
                query: sparqlQuery,
                format: 'application/sparql-results+xml',
            },
        });
        
        const xmlData = response.data;
        const jsonData = await parseStringPromise(xmlData, {explicitArray: false})

        const results = jsonData['sparql']['results']['result']

        if (!results) {
            return null;
        }

        // Map the results to an object
        const result = Array.isArray(results) ? results[0] : results;

        return {
            description: result['binding']?.find((b) => b['$'].name === 'description')?.literal || null,
            regulationDescription: result['binding']?.find((b) => b['$'].name === 'regulationDescription')?.literal || null,
            adviceDescription: result['binding']?.find((b) => b['$'].name === 'adviceDescription')?.literal || null,
            contextDescription: result['binding']?.find((b) => b['$'].name === 'contextDescription')?.literal || null,
        };
        
    } catch (error) {
        console.error('Error querying SPARQL endpoint:', error.message);
        throw new Error('Failed to query the ontology.');
    }
};

module.exports = {
    getTrafficSignDetails,
};
