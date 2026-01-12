declare module "jsonwebtoken" {
  export interface JwtPayload {
    [key: string]: any
  }

  export function sign(payload: string | Buffer | object, secretOrPrivateKey: string | Buffer, options?: any): string

  export function verify(token: string, secretOrPublicKey: string | Buffer, options?: any): JwtPayload | string

  export function decode(token: string, options?: any): null | JwtPayload | string
}
