import { useState } from 'react';
import { Megaphone, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import SettingsCard from './shared/SettingsCard';
import {
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_CONTACT_STAGES,
  CAMPAIGN_ACCOUNT_STATUSES,
  CALL_OUTCOMES,
  LINKEDIN_STATUSES,
  EMAIL_TYPES,
  AUDIENCE_SEGMENTS,
} from '@/types/campaign';

const CampaignSettings = () => {
  const { toast } = useToast();
  const [followUpDays, setFollowUpDays] = useState('3');
  const [maxFollowUps, setMaxFollowUps] = useState('3');

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={Megaphone}
        title="Campaign Configuration"
        description="View campaign types, stages, and default settings"
      >
        <div className="space-y-6">
          {/* Campaign Types */}
          <div>
            <Label className="text-sm font-medium">Campaign Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CAMPAIGN_TYPES.map(t => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>

          {/* Campaign Statuses */}
          <div>
            <Label className="text-sm font-medium">Campaign Statuses</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CAMPAIGN_STATUSES.map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>

          {/* Audience Segments */}
          <div>
            <Label className="text-sm font-medium">Audience Segments</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AUDIENCE_SEGMENTS.map(s => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Megaphone}
        title="Contact & Account Stages"
        description="Review the stages used for campaign contacts and accounts"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium">Contact Stages</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CAMPAIGN_CONTACT_STAGES.map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Account Statuses</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CAMPAIGN_ACCOUNT_STATUSES.map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Megaphone}
        title="Outreach Options"
        description="View call outcomes, LinkedIn statuses, and email types"
      >
        <div className="grid grid-cols-3 gap-6">
          <div>
            <Label className="text-sm font-medium">Call Outcomes</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CALL_OUTCOMES.map(o => (
                <Badge key={o} variant="outline">{o}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">LinkedIn Statuses</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LINKEDIN_STATUSES.map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Email Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMAIL_TYPES.map(t => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Megaphone}
        title="Follow-Up Rules"
        description="Configure default follow-up timing for campaigns"
      >
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <Label>Days Between Follow-Ups</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={followUpDays}
              onChange={e => setFollowUpDays(e.target.value)}
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label>Max Follow-Ups</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={maxFollowUps}
              onChange={e => setMaxFollowUps(e.target.value)}
              className="h-9 mt-1"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          These defaults are used when creating new campaigns. Individual campaigns can override these values.
        </p>
      </SettingsCard>
    </div>
  );
};

export default CampaignSettings;
