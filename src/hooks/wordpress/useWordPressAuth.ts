
import { toast } from "@/hooks/use-toast";

/**
 * Prepares authentication headers for WordPress API requests
 */
export const prepareWordPressAuthHeaders = (wpConfig: {
  app_username?: string;
  app_password?: string;
  rest_api_key?: string;
  username?: string;
  password?: string;
}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  let authenticationSuccess = false;
  
  // Try application password first (recommended method)
  if (wpConfig.app_username && wpConfig.app_password) {
    try {
      // Proper encoding for application passwords
      const appUsername = wpConfig.app_username.trim();
      const appPassword = wpConfig.app_password.trim();
      const credentials = `${appUsername}:${appPassword}`;
      const base64Credentials = btoa(credentials);
      headers['Authorization'] = `Basic ${base64Credentials}`;
      console.log("Using Application Password authentication");
      console.log("Username for auth:", appUsername);
      authenticationSuccess = true;
    } catch (authError) {
      console.error("Error setting up application password auth:", authError);
    }
  }
  
  // Try REST API key if application password failed
  if (!authenticationSuccess && wpConfig.rest_api_key) {
    headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
    console.log("Using REST API Key authentication");
    authenticationSuccess = true;
  }
  
  // Try regular credentials as last resort
  if (!authenticationSuccess && wpConfig.username && wpConfig.password) {
    try {
      const username = wpConfig.username.trim();
      const password = wpConfig.password.trim();
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      headers['Authorization'] = `Basic ${base64Credentials}`;
      console.log("Using Legacy Basic authentication");
      authenticationSuccess = true;
    } catch (error) {
      console.error("Error with standard credentials:", error);
    }
  }
  
  if (!authenticationSuccess) {
    console.error("No valid WordPress authentication credentials available");
  }
  
  return { headers, authenticationSuccess };
};

/**
 * Attempts WordPress authentication through JWT if available
 */
export const tryJwtAuthentication = async (
  siteUrl: string,
  credentials: { username: string; password: string },
  wpPostData: any
) => {
  try {
    // Attempt authentication via JWT
    const jwtAuthEndpoint = `${siteUrl}/wp-json/jwt-auth/v1/token`;
    console.log("Trying JWT authentication at:", jwtAuthEndpoint);
    
    const jwtResponse = await fetch(jwtAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      })
    });
    
    if (!jwtResponse.ok) {
      console.error("JWT authentication failed:", jwtResponse.status);
      return { success: false };
    }
    
    const jwtData = await jwtResponse.json();
    if (!jwtData.token) {
      console.error("JWT response missing token");
      return { success: false };
    }
    
    console.log("JWT authentication successful, using token for request");
    
    // Use the JWT token for the post request
    const jwtHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtData.token}`
    };
    
    const jwtPostResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: jwtHeaders,
      body: JSON.stringify(wpPostData)
    });
    
    if (!jwtPostResponse.ok) {
      console.error("Post request with JWT failed:", jwtPostResponse.status);
      const errorText = await jwtPostResponse.text();
      console.error("Error details:", errorText);
      return { success: false };
    }
    
    return {
      success: true,
      responseData: await jwtPostResponse.json()
    };
  } catch (error) {
    console.error("JWT authentication error:", error);
    return { success: false };
  }
};

/**
 * Attempts WordPress authentication through cookie-based login
 */
export const tryFormAuthentication = async (
  siteUrl: string,
  credentials: { username: string; password: string },
  wpPostData: any,
  postEndpoint: string
) => {
  try {
    console.log("Trying form-based authentication");
    
    // Cookie management
    const cookieJar = new Map<string, string>();
    
    // Helper to extract cookies from response
    const extractCookies = (response: Response) => {
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const cookies = setCookieHeader.split(',');
        cookies.forEach(cookie => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) {
            cookieJar.set(name.trim(), value.trim());
          }
        });
      }
    };
    
    // Helper to create cookie header string
    const getCookieHeader = () => {
      let cookieStr = '';
      cookieJar.forEach((value, name) => {
        cookieStr += `${name}=${value}; `;
      });
      return cookieStr;
    };
    
    // First request to get login form
    const loginPageResponse = await fetch(`${siteUrl}/wp-login.php`, {
      method: 'GET',
      credentials: 'include'
    });
    
    extractCookies(loginPageResponse);
    
    // Submit login form
    const loginFormData = new FormData();
    loginFormData.append('log', credentials.username);
    loginFormData.append('pwd', credentials.password);
    loginFormData.append('wp-submit', 'Log In');
    loginFormData.append('redirect_to', `${siteUrl}/wp-admin/`);
    loginFormData.append('testcookie', '1');
    
    const loginResponse = await fetch(`${siteUrl}/wp-login.php`, {
      method: 'POST',
      body: loginFormData,
      credentials: 'include',
      headers: {
        'Cookie': getCookieHeader()
      }
    });
    
    extractCookies(loginResponse);
    
    // Check login status
    if (loginResponse.ok || loginResponse.status === 302) {
      console.log("Form login successful, attempting post with session cookies");
      
      // Use cookies for post request
      const cookieHeaders = {
        'Content-Type': 'application/json',
        'Cookie': getCookieHeader()
      };
      
      const cookiePostResponse = await fetch(postEndpoint, {
        method: 'POST',
        headers: cookieHeaders,
        body: JSON.stringify(wpPostData),
        credentials: 'include'
      });
      
      if (!cookiePostResponse.ok) {
        console.error("Post with cookie auth failed:", cookiePostResponse.status);
        const errorText = await cookiePostResponse.text();
        console.error("Error details:", errorText);
        return { success: false };
      }
      
      return {
        success: true,
        responseData: await cookiePostResponse.json()
      };
    }
    
    console.error("Form login failed:", loginResponse.status);
    return { success: false };
  } catch (error) {
    console.error("Form auth error:", error);
    return { success: false };
  }
};
