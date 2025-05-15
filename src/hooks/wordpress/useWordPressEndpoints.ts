
/**
 * Detects WordPress API endpoints and custom post types
 */
export const detectWordPressEndpoints = async (siteUrl: string) => {
  let useCustomTaxonomy = false;
  let customEndpointExists = false;
  let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`; // Default endpoint
  
  try {
    console.log("Checking if dipi_cpt_category endpoint exists...");
    const taxonomyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.log("Error checking taxonomy endpoint:", err);
      return { status: 404 };
    });
    
    if (taxonomyResponse && taxonomyResponse.status !== 404) {
      console.log("DipiPixel taxonomy endpoint found!");
      useCustomTaxonomy = true;
      
      // Check if dipi_cpt endpoint exists
      console.log("Checking if dipi_cpt endpoint exists...");
      const customPostTypeResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(err => {
        console.log("Error checking custom post type endpoint:", err);
        return { status: 404 };
      });
      
      if (customPostTypeResponse && customPostTypeResponse.status !== 404) {
        console.log("DipiPixel custom post type endpoint found!");
        postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
        customEndpointExists = true;
      } else {
        // Check alternative endpoint
        console.log("Checking if dipicpt endpoint exists...");
        const altResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipicpt`, {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.log("Error checking alternative endpoint:", err);
          return { status: 404 };
        });
        
        if (altResponse && altResponse.status !== 404) {
          console.log("Alternative dipicpt endpoint found!");
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
          customEndpointExists = true;
        } else {
          console.log("No custom post type endpoint found, falling back to posts");
        }
      }
    } else {
      console.log("No custom taxonomy endpoint found, using standard categories");
    }
  } catch (error) {
    console.log("Error checking endpoints:", error);
    console.log("Falling back to standard posts endpoint");
  }
  
  console.log("Using WordPress endpoint:", postEndpoint, "with custom taxonomy:", useCustomTaxonomy);
  
  return {
    postEndpoint,
    useCustomTaxonomy,
    customEndpointExists
  };
};
