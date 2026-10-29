/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Alert, Button, IconButton, PageContent, PageTitle, Stack, Tooltip } from '@wso2/oxygen-ui';
import { Plus, RefreshCw } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useDatabaseAvailability, useDatabaseOffering, useDatabaseServers } from '../hooks/useDatabases';
import { databaseUrl, newDatabaseUrl, type OrgScope } from '../nav';
import DatabaseServersTable from '../components/Databases/DatabaseServersTable';
import NoDatabaseServersBanner from '../components/Databases/NoDatabaseServersBanner';
import { DatabaseListSkeleton } from '../components/Databases/DatabaseSkeletons';
import type { DatabasePlan } from '../types/databases';

const headerSx = { mb: 3 } as const;
const NO_PLANS: readonly DatabasePlan[] = [];

export default function OrgDatabases(scope: OrgScope): JSX.Element {
  const navigate = useAppNavigate();
  const availability = useDatabaseAvailability();
  const available = availability.data?.available === true;
  const servers = useDatabaseServers(available);
  // Describes each database's plan; until it loads (or if it fails) the list shows plan names alone.
  const offering = useDatabaseOffering(available);

  const create = () => navigate(newDatabaseUrl(scope));
  const retry = () => {
    availability.refetch();
    servers.refetch();
  };
  const retryButton = (
    <Button color="inherit" size="small" onClick={retry}>
      Retry
    </Button>
  );
  // A failed poll keeps the last good data, so the list (and any delete dialog open on it) stays up.
  const failed = (availability.isError && !availability.data) || (available && servers.isError && !servers.data);
  const stale = !failed && (availability.isError || (available && servers.isError));

  const body = (): JSX.Element => {
    if (availability.isLoading || (available && servers.isLoading)) return <DatabaseListSkeleton />;
    if (failed)
      return (
        <Alert severity="error" action={retryButton}>
          Failed to load services.
        </Alert>
      );
    if (!available) return <Alert severity="info">Platform services are not available in this environment.</Alert>;
    if (!servers.data?.length) return <NoDatabaseServersBanner onCreate={create} />;
    return <DatabaseServersTable servers={servers.data} plans={offering.data?.plans ?? NO_PLANS} onOpenServer={(server) => navigate(databaseUrl(scope, server.id))} />;
  };

  return (
    <PageContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={headerSx}>
        <PageTitle>
          <PageTitle.Header>Platform Services</PageTitle.Header>
          <PageTitle.SubHeader>Managed services your integrations can connect to.</PageTitle.SubHeader>
        </PageTitle>
        {!!servers.data?.length && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Refresh">
              <span>
                <IconButton size="small" aria-label="Refresh services" onClick={() => servers.refetch()} disabled={servers.isFetching}>
                  <RefreshCw size={16} />
                </IconButton>
              </span>
            </Tooltip>
            <Button variant="contained" startIcon={<Plus size={20} />} onClick={create} sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              Create
            </Button>
          </Stack>
        )}
      </Stack>
      {stale && (
        <Alert severity="warning" action={retryButton} sx={{ mb: 2 }}>
          Couldn&apos;t refresh services. Showing the last loaded list.
        </Alert>
      )}
      {body()}
    </PageContent>
  );
}
