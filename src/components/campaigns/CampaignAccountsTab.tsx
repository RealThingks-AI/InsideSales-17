import { useState } from 'react';
import { useCampaignAccounts } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CAMPAIGN_ACCOUNT_STATUSES } from '@/types/campaign';

interface Props {
  campaignId: string;
}

export function CampaignAccountsTab({ campaignId }: Props) {
  const { query, addAccount, removeAccount, updateAccountStatus } = useCampaignAccounts(campaignId);
  const [addOpen, setAddOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allAccountsQuery = useQuery({
    queryKey: ['all_accounts_for_campaign'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, account_name, industry, country').order('account_name');
      return data || [];
    },
    enabled: addOpen,
  });

  const existingIds = new Set((query.data || []).map(a => a.account_id));
  const availableAccounts = (allAccountsQuery.data || []).filter(
    a => !existingIds.has(a.id) && a.account_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAdd = async () => {
    const ids = Array.from(selectedIds);
    for (const accountId of ids) {
      await addAccount.mutateAsync({ accountId });
    }
    setSelectedIds(new Set());
    setAddOpen(false);
  };

  const handleSingleAdd = (accountId: string) => {
    addAccount.mutate({ accountId });
    setAddOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Target Accounts ({query.data?.length || 0})</span>
        <Popover open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setSelectedIds(new Set()); setAccountSearch(''); } }}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Accounts</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="end">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search accounts..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {availableAccounts.map(a => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.has(a.id)}
                    onCheckedChange={() => toggleSelect(a.id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate flex-1">
                    {a.account_name}
                    {a.industry && <span className="text-muted-foreground ml-1">· {a.industry}</span>}
                  </span>
                  <button
                    className="text-primary text-[10px] font-medium shrink-0 hover:underline"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSingleAdd(a.id); }}
                  >
                    Add
                  </button>
                </label>
              ))}
              {!availableAccounts.length && <p className="text-xs text-muted-foreground p-2">No accounts found</p>}
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between border-t border-border mt-2 pt-2 px-1">
                <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                <Button size="sm" className="h-7 text-xs" onClick={handleBulkAdd} disabled={addAccount.isPending}>
                  Add Selected
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {!query.data?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">No accounts added yet</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map(ca => (
              <TableRow key={ca.id}>
                <TableCell className="font-medium text-sm">{ca.accounts?.account_name || '—'}</TableCell>
                <TableCell className="text-sm">{ca.accounts?.industry || '—'}</TableCell>
                <TableCell className="text-sm">{ca.accounts?.country || '—'}</TableCell>
                <TableCell>
                  <Select value={ca.status} onValueChange={v => updateAccountStatus.mutate({ id: ca.id, status: v })}>
                    <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_ACCOUNT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAccount.mutate(ca.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
