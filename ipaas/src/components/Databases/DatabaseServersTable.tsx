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

import { Box, Chip, IconButton, ListingTable, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Database, Trash2 } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import { DATABASE_STATUS_COLORS, DATABASE_STATUS_LABELS } from '../../constants/databases';
import { CARD_TABLE_SX } from '../../constants/styles';
import { isDatabaseOpenable } from '../../utils/databases';
import { formatDateTime, formatDistanceToNow } from '../../utils/time';
import type { DatabasePlan, DatabaseServer } from '../../types/databases';
import DeleteDatabaseDialog from './DeleteDatabaseDialog';
import ServicePlanCell from './ServicePlanCell';

interface DatabaseServersTableProps {
  servers: DatabaseServer[];
  /** The offered plans, which describe each database's size; empty while they load, leaving just the plan names. */
  plans: readonly DatabasePlan[];
  onOpenServer: (server: DatabaseServer) => void;
}

export default function DatabaseServersTable({ servers, plans, onOpenServer }: DatabaseServersTableProps): JSX.Element {
  const [deleting, setDeleting] = useState<DatabaseServer | null>(null);
  return (
    <ListingTable.Container disablePaper>
      <ListingTable variant="card" density="compact" sx={CARD_TABLE_SX}>
        <ListingTable.Head>
          <ListingTable.Row>
            <ListingTable.Cell>Name</ListingTable.Cell>
            <ListingTable.Cell>Status</ListingTable.Cell>
            <ListingTable.Cell>Service Plan</ListingTable.Cell>
            <ListingTable.Cell>Created</ListingTable.Cell>
            <ListingTable.Cell align="right">Actions</ListingTable.Cell>
          </ListingTable.Row>
        </ListingTable.Head>
        <ListingTable.Body>
          {servers.map((server) => {
            const openable = isDatabaseOpenable(server.status);
            return (
              <ListingTable.Row
                key={server.id}
                variant="card"
                hover={openable}
                clickable={openable}
                role={openable ? 'button' : undefined}
                tabIndex={openable ? 0 : undefined}
                aria-label={openable ? `Open ${server.name}` : undefined}
                onClick={openable ? () => onOpenServer(server) : undefined}
                onKeyDown={
                  openable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenServer(server);
                        }
                      }
                    : undefined
                }>
                <ListingTable.Cell>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Database size={20} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {server.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {server.postgresVersion ? `PostgreSQL ${server.postgresVersion}` : 'PostgreSQL'}
                      </Typography>
                    </Box>
                  </Stack>
                </ListingTable.Cell>
                <ListingTable.Cell>
                  <Chip label={DATABASE_STATUS_LABELS[server.status]} color={DATABASE_STATUS_COLORS[server.status]} size="small" variant="outlined" />
                </ListingTable.Cell>
                <ListingTable.Cell>
                  {server.plan ? (
                    <ServicePlanCell planId={server.plan} plan={plans.find((p) => p.id === server.plan)} nodeCount={server.nodeCount} storageGi={server.storageGi} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </ListingTable.Cell>
                <ListingTable.Cell>
                  {server.createdAt ? (
                    <Box>
                      <Typography variant="body2">{formatDistanceToNow(server.createdAt)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(server.createdAt)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </ListingTable.Cell>
                <ListingTable.Cell align="right">
                  {/* A database being torn down is already on its way out. */}
                  {openable && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Delete ${server.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(server);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListingTable.Cell>
              </ListingTable.Row>
            );
          })}
        </ListingTable.Body>
      </ListingTable>
      {deleting && <DeleteDatabaseDialog server={deleting} onClose={() => setDeleting(null)} />}
    </ListingTable.Container>
  );
}
