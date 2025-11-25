
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { ClientTransaction } from '@/types';
import { invalidateClientTransactionsCache, invalidateCounterAgentsCache, invalidateAggregatorsCache } from '@/lib/data-loader';

const dataDir = path.join(process.cwd(), 'data', 'client-transactions');

async function ensureDataDirectory() {
  try {
    await fs.access(dataDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dataDir, { recursive: true });
    } else {
      throw error;
    }
  }
}

async function readTransactions(clientId: string): Promise<ClientTransaction[]> {
    const filePath = path.join(dataDir, `${clientId}.json`);
    try {
        await ensureDataDirectory();
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent) as ClientTransaction[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []; // No transactions file yet, return empty array
        }
        throw error; // Other errors should be propagated
    }
}

async function writeTransactions(clientId: string, transactions: ClientTransaction[]) {
    const filePath = path.join(dataDir, `${clientId}.json`);
    await ensureDataDirectory();
    await fs.writeFile(filePath, JSON.stringify(transactions, null, 2), 'utf-8');
    invalidateClientTransactionsCache(clientId);
    if (clientId.startsWith('agent_')) {
        invalidateCounterAgentsCache();
    } else if (clientId.startsWith('agg_')) {
        invalidateAggregatorsCache();
    }
}

async function updateClientBalance(clientId: string, amountChange: number, req: Request) {
    const clientType = clientId.startsWith('agent_') ? 'counter-agent' : 'aggregator';
    const clientApiUrl = `/api/${clientType === 'counter-agent' ? 'counter-agents' : 'aggregators'}/${clientId}`;
    const absoluteUrl = new URL(req.url);
    const fetchUrl = `${absoluteUrl.protocol}//${absoluteUrl.host}${clientApiUrl}`;

    try {
        const clientRes = await fetch(fetchUrl, { cache: 'no-store' });
        if (!clientRes.ok) throw new Error(`Could not fetch client data to update balance.`);
        
        const clientData = await clientRes.json();
        const currentBalance = clientData.balance ?? 0;
        clientData.balance = currentBalance + amountChange;
        
        const updateRes = await fetch(fetchUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        if (!updateRes.ok) throw new Error(`Could not update client balance after transaction change.`);

    } catch (error) {
        console.error("Failed to update client balance:", error);
        // This is a critical failure, we should indicate it
        throw new Error("Failed to update client balance.");
    }
}


export async function POST(request: Request, { params }: { params: { clientId: string } }) {
  const clientId = params.clientId;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }

  try {
    const newTransactionData = await request.json();

    if (!newTransactionData.amount || !newTransactionData.description) {
        return NextResponse.json({ error: 'Missing required transaction fields' }, { status: 400 });
    }
    
    const amountToAdd = Number(newTransactionData.amount);

    const currentTransactions = await readTransactions(clientId);
    
    const transactionToSave: ClientTransaction = {
      id: `client_txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      clientId: clientId,
      date: new Date().toISOString(),
      type: 'payment',
      amount: amountToAdd,
      description: newTransactionData.description,
    };

    currentTransactions.push(transactionToSave);

    // Update balance FIRST - if this fails, we don't write the transaction file
    await updateClientBalance(clientId, amountToAdd, request);

    // Only write transactions after balance is successfully updated
    await writeTransactions(clientId, currentTransactions);

    return NextResponse.json({ message: 'Transaction added successfully', transaction: transactionToSave }, { status: 201 });

  } catch (error: any) {
    console.error(`Error adding transaction for client ${clientId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { clientId: string } }) {
  const clientId = params.clientId;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  if (!transactionId) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  try {
    let transactions = await readTransactions(clientId);
    
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    transactions = transactions.filter(t => t.id !== transactionId);

    // Update balance FIRST - if this fails, we don't write the updated transactions
    await updateClientBalance(clientId, -transactionToDelete.amount, request);

    // Only write transactions after balance is successfully updated
    await writeTransactions(clientId, transactions);

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting transaction for client ${clientId}:`, error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
