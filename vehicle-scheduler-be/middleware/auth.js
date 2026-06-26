function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "An authorization header with Bearer token is required" });
  }

  const token = authHeader.split(" ")[1];
  const payload = parseJwt(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid authorization token" });
  }

  const exp = payload.MapClaims?.exp || payload.exp;
  if (exp && Date.now() >= exp * 1000) {
    return res.status(401).json({ message: "Token has expired" });
  }

  req.user = payload;
  next();
}
