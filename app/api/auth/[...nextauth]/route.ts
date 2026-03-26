import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});
export { handler as GET, handler as POST };