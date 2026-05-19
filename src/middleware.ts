import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// RBAC 权限配置：路径前缀 -> 允许的角色
const RBAC_RULES: Record<string, string[]> = {
  // 财务模块：仅限 ADMIN 和 FINANCE
  '/accounting': ['ADMIN', 'FINANCE'],
  // 仓库模块：限 ADMIN, WAREHOUSE, SALES (SALES 可查看但不能操作)
  '/stock': ['ADMIN', 'WAREHOUSE'],
  // 生产模块：限 ADMIN, WAREHOUSE
  '/manufacturing': ['ADMIN', 'WAREHOUSE'],
  // 采购模块：限 ADMIN, PURCHASE
  '/buying': ['ADMIN', 'PURCHASE'],
  // 用户设置：仅限 ADMIN
  '/settings/users': ['ADMIN'],
}

// 公开路径（无需登录）
const PUBLIC_PATHS = ['/login', '/api/auth', '/_next', '/favicon.ico', '/public']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function checkRBAC(pathname: string, userRole: string): boolean {
  for (const [path, allowedRoles] of Object.entries(RBAC_RULES)) {
    if (pathname.startsWith(path)) {
      return allowedRoles.includes(userRole)
    }
  }
  // 默认允许（其他路径不限制）
  return true
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // 1. 公开路径放行
    if (isPublicPath(pathname)) {
      return NextResponse.next()
    }

    // 2. 未登录，重定向到登录页
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(req.url))
      return NextResponse.redirect(loginUrl)
    }

    // 3. RBAC 权限检查
    const userRole = (token.role as string) || 'SALES'
    if (!checkRBAC(pathname, userRole)) {
      // 权限不足，重定向到 403 或首页
      const forbiddenUrl = new URL('/403', req.url)
      return NextResponse.redirect(forbiddenUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  //  matcher 排除静态资源和非动态路由
  matcher: [
    /*
     * 排除以下路径：
     * - api/auth (NextAuth 内部)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     * - public 目录
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'
  ]
}