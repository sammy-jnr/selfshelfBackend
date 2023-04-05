const axios = require("axios")

export const getUserInfoWithGoogle = async(client_id:string, client_secret:string, redirect_uri:string, code:string)  => {

  const data = await getAccessToken(client_id, client_secret, redirect_uri, code)
  const userInfo = await getUserInfo(data)
  return userInfo
}

const getAccessToken = async(client_id:string, client_secret:string, redirect_uri:string, code:string) => {
  try {
    const { data } = await axios({
      withCredentials: true,
      url: `https://oauth2.googleapis.com/token`,
      method: "post",
      data:{
       client_id,
       client_secret,
       redirect_uri,
       grant_type: "authorization_code",
       code
      }
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

const getUserInfo = async(data:any) => {
  try {
    const userInfo = await axios({
      withCredentials: true,
      url: `https://www.googleapis.com/oauth2/v2/userinfo`,
      method: "get",
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      }
    })
    return   userInfo.data
    } catch (error) {
      console.log(error)
    }
}

