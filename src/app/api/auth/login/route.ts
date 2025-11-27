
import { NextResponse } from 'next/server';
import { getEmployeesData } from '@/lib/data-loader';
import { serialize } from 'cookie';
import type { Employee } from '@/types';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
    }

    const employees = await getEmployeesData();
    const employee = employees.find(
      (emp) => emp.username === username && emp.password === password
    );

    if (!employee) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    // В реальном приложении здесь была бы логика создания сессии (например, JWT)
    // Для простоты мы просто возвращаем данные сотрудника, исключая пароль
    const { password: _, ...employeeData } = employee;

    const cookieValue = JSON.stringify(employeeData);
    const cookie = serialize('employee_auth_sim', cookieValue, {
        path: '/',
        // httpOnly: true, // This was the problem. Removing it.
        secure: false, // Changed for HTTP compatibility
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const response = NextResponse.json({ employee: employeeData });
    response.headers.set('Set-Cookie', cookie);
    
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
