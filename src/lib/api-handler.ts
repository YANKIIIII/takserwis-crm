import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params?: Promise<Record<string, string | string[]>> } | unknown;
type RouteHandler = (request: NextRequest, context: RouteContext) => Promise<NextResponse> | NextResponse;

/**
 * Обертка для всех API-роутов (Route Handlers) в приложении.
 * Централизует логирование ошибок и возврат стандартного ответа (status: 500) с сообщением.
 * Это предотвращает падение сервера и дублирование try/catch блоков в контроллерах.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}
