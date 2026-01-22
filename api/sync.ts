
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Inicialização da Tabela se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS natsumi_expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value DECIMAL(12,2) NOT NULL,
        due_date DATE NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS natsumi_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;

    if (req.method === 'GET') {
      const expenses = await sql`SELECT * FROM natsumi_expenses ORDER BY due_date ASC`;
      const revenueData = await sql`SELECT value FROM natsumi_config WHERE key = 'revenue'`;
      
      return new Response(JSON.stringify({
        expenses: expenses.map(e => ({
          id: e.id,
          name: e.name,
          value: parseFloat(e.value),
          dueDate: e.due_date.toISOString().split('T')[0],
          category: e.category,
          status: e.status
        })),
        revenue: revenueData[0] ? parseFloat(revenueData[0].value) : 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const { expenses, revenue } = await req.json();

      // Transação simplificada: Limpa e reinsere para garantir integridade do estado global (Sync completo)
      // Em produção real usaríamos UPSERTs individuais, mas para manter a lógica de "Database Sync" do App:
      await sql`DELETE FROM natsumi_expenses`;
      
      for (const exp of expenses) {
        await sql`
          INSERT INTO natsumi_expenses (id, name, value, due_date, category, status)
          VALUES (${exp.id}, ${exp.name}, ${exp.value}, ${exp.dueDate}, ${exp.category}, ${exp.status})
        `;
      }

      await sql`
        INSERT INTO natsumi_config (key, value)
        VALUES ('revenue', ${revenue.toString()})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
