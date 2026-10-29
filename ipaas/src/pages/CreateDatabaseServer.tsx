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

import { Alert, Box, Button, CircularProgress, Grid, PageContent, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import TextField from '../components/common/TextField';
import SelectableCard from '../components/Databases/SelectableCard';
import PlanCard from '../components/Databases/PlanCard';
import { DatabasePlansSkeleton } from '../components/Databases/DatabaseSkeletons';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useCreateDatabaseServer, useDatabaseOffering, useDatabaseServers } from '../hooks/useDatabases';
import { DATABASE_ENGINES } from '../constants/databases';
import { REQUIRED_FIELD_SX } from '../constants/styles';
import { databaseNameError, toCreateDatabaseError } from '../utils/databases';
import { databaseUrl, orgDatabasesUrl, type OrgScope } from '../nav';
import type { DatabaseOffering } from '../types/databases';

const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
const sectionHeadingSx = { fontWeight: 600, mb: 1.5 } as const;
const fieldSx = { maxWidth: 480, ...REQUIRED_FIELD_SX } as const;

function planeLabel(plane: NonNullable<DatabaseOffering['plane']>): string {
  const name = plane.displayName || plane.name;
  const where = [plane.region, plane.cloud?.toUpperCase()].filter(Boolean).join(', ');
  return where ? `${name} (${where})` : name;
}

export default function CreateDatabaseServer(scope: OrgScope): JSX.Element {
  const navigate = useAppNavigate();
  const servers = useDatabaseServers();
  const offering = useDatabaseOffering();
  const create = useCreateDatabaseServer();

  const [name, setName] = useState('');
  // An unset pick falls back to the provider's default plan, so the selection
  // is always a valid offering without syncing state to the fetched data.
  const [pickedPlan, setPickedPlan] = useState('');

  const plans = offering.data?.plans ?? [];
  const planId = plans.some((p) => p.id === pickedPlan) ? pickedPlan : (offering.data?.defaultPlan ?? plans[0]?.id ?? '');

  const takenNames = (servers.data ?? []).map((s) => s.name);
  const nameError = databaseNameError(name, takenNames, offering.data?.maxNameLength);
  const canCreate = name !== '' && !nameError && !!planId && !create.isPending;
  const createError = create.isError ? toCreateDatabaseError(create.error) : null;

  const submit = () => {
    create.mutate({ name, plan: planId || undefined }, { onSuccess: (server) => navigate(databaseUrl(scope, server.id)) });
  };

  const typeAndName = (
    <>
      <Typography variant="subtitle2" sx={sectionHeadingSx}>
        Select Service Type
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {DATABASE_ENGINES.map((engine) => {
          const card = <SelectableCard title={engine.name} description={engine.description} logo={assetUrl(engine.logo)} selected={engine.id === 'postgres'} disabled={!engine.available} onSelect={() => undefined} />;
          return (
            <Grid key={engine.id} size={{ xs: 12, sm: 4 }}>
              {engine.available ? (
                card
              ) : (
                <Tooltip title={`${engine.name} is not available yet.`}>
                  <span>{card}</span>
                </Tooltip>
              )}
            </Grid>
          );
        })}
      </Grid>
      <TextField label="Name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} error={!!nameError} helperText={nameError || 'Lowercase letters, digits and hyphens.'} sx={fieldSx} />
    </>
  );

  const planSection = offering.isLoading ? (
    <DatabasePlansSkeleton />
  ) : offering.isError ? (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => offering.refetch()}>
          Retry
        </Button>
      }>
      Failed to load the service plans.
    </Alert>
  ) : !plans.length ? (
    <Alert severity="info">No service plans are offered.</Alert>
  ) : (
    <>
      {/* The major is the deployment's choice (the BFF's PAAS_POSTGRES_VERSION), not the user's. */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        PostgreSQL {offering.data?.postgresVersion}
        {offering.data?.plane && `, running on ${planeLabel(offering.data.plane)}`}.
      </Typography>
      <Typography variant="subtitle2" sx={sectionHeadingSx}>
        Select Service Plan
      </Typography>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} selected={planId === plan.id} onSelect={() => setPickedPlan(plan.id)} />
        ))}
      </Stack>
    </>
  );

  return (
    <PageContent>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(orgDatabasesUrl(scope))} sx={{ mb: 2 }}>
        Back to Platform Services
      </Button>

      <Box sx={{ maxWidth: 900 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Create Service
        </Typography>

        {createError && (
          <Alert severity="error" onClose={() => create.reset()} sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {createError.title}
            </Typography>
            <Typography variant="body2">{createError.message}</Typography>
          </Alert>
        )}

        {typeAndName}
        <Box sx={{ mt: 4 }}>{planSection}</Box>

        <Stack direction="row" gap={1.5} sx={{ mt: 4 }}>
          <Button variant="contained" disabled={!canCreate} startIcon={create.isPending ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={submit}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
          <Button variant="outlined" disabled={create.isPending} onClick={() => navigate(orgDatabasesUrl(scope))}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </PageContent>
  );
}
