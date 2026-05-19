import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// RBAC 角色类型
export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'FINANCE' | 'PURCHASE';

// 角色权限定义
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'], // 管理员拥有所有权限
  SALES: ['crm', 'selling', 'delivery'],
  WAREHOUSE: ['stock', 'manufacturing', 'buying'],
  FINANCE: ['accounting', 'selling'],
  PURCHASE: ['buying', 'stock'],
};

// 检查角色是否有权限访问特定模块
export function hasPermission(role: UserRole, module: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(module);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@erpnext.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        if (!user.password) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) return null;
        if (!user.isActive) throw new Error("Account is disabled");

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role as string,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'SALES';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || 'SALES';
      }
      return session;
    }
  }
};