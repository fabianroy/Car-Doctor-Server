
/*

----------------------------------
        MAKE API SECURE
----------------------------------

1. Assign two tokens for each person (access toke, refresh token)
2. Access token contains: user identification (email, role, etc.) [valid for shorter duration]
3. Refresh token is used to recreate an access token that was expired
4. If refresh is invalid then logout the user 

*/

/*

 1. jwt --> json web token
 2. Generate a token by using jwt.sign
 3. Create API set to cookie. httpOnly, secure, sameSite
 4. From client side: axios withCredentials: true
 5. Cors setup origin and credentials: true

*/

/*

 1. Forsecure API calls
 2. Server side : Install cookie parser ans use it as a middleware
 3. req.cookies
 4. On the client side: Make API call using axios withCredentials: true
 5. 

*/