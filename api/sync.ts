
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    return new Response(JSON.stringify({
      error: 'Variável de ambiente DATABASE_URL não encontrada.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Extração via Regex: Procura apenas pelo padrão da URL (postgresql://...) 
  // e ignora o comando 'psql', aspas e outros caracteres ao redor.
  const urlMatch = rawDatabaseUrl.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);

  if (!urlMatch) {
    return new Response(JSON.stringify({
      error: 'Formato de DATABASE_URL inválido. A string deve conter uma URL válida começando com postgresql://'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const databaseUrl = urlMatch[0];

  try {
    const sql = neon(databaseUrl);

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
      const configEntries = await sql`SELECT key, value FROM natsumi_config`;

      const config = configEntries.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      return new Response(JSON.stringify({
        expenses: expenses.map(e => ({
          id: e.id,
          name: e.name,
          value: parseFloat(e.value),
          dueDate: new Date(e.due_date).toISOString().split('T')[0],
          category: e.category,
          status: e.status
        })),
        revenue: config['revenue'] ? parseFloat(config['revenue']) : 0,
        revenueDate: config['revenue_date'] || null,
        revenueStartDate: config['revenue_start'] || null,
        revenueEndDate: config['revenue_end'] || null,
        filterStartDate: config['filter_start'] || null,
        filterEndDate: config['filter_end'] || null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const { expenses, revenue, revenueDate, revenueStartDate, revenueEndDate, filterStartDate, filterEndDate } = await req.json();

      await sql`DELETE FROM natsumi_expenses`;

      if (expenses && expenses.length > 0) {
        for (const exp of expenses) {
          await sql`
            INSERT INTO natsumi_expenses (id, name, value, due_date, category, status)
            VALUES (${exp.id}, ${exp.name}, ${exp.value}, ${exp.dueDate}, ${exp.category}, ${exp.status})
          `;
        }
      }

      // Helper to upsert config
      const upsertConfig = async (key: string, value: string) => {
        await sql`
          INSERT INTO natsumi_config (key, value)
          VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      };

      await upsertConfig('revenue', revenue?.toString() || '0');
      if (revenueDate) await upsertConfig('revenue_date', revenueDate);
      if (revenueStartDate) await upsertConfig('revenue_start', revenueStartDate);
      if (revenueEndDate) await upsertConfig('revenue_end', revenueEndDate);
      if (filterStartDate) await upsertConfig('filter_start', filterStartDate);
      if (filterEndDate) await upsertConfig('filter_end', filterEndDate);

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error: any) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro de conexão: Verifique se a DATABASE_URL no painel da Vercel está correta.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
