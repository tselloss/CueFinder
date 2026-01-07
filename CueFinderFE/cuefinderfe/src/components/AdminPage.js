import React, { useEffect, useState } from 'react';
import { Box, Button, Heading, Text, Card, CardBody, DataTable, Grid } from 'grommet';
import { FormPrevious, Trash, Flag, Close, StatusGood } from 'grommet-icons';
import * as adminService from '../api/adminService';
import * as cueService from '../api/cueService';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);

  useEffect(() => {
    async function load() {
      const [u, c] = await Promise.all([adminService.getUsers(), cueService.getCues()]);
      setUsers(u);
      setCues(c);
    }
    load();
  }, []);

  const toggleBan = async (user) => {
    const updated = user.banned ? await adminService.unbanUser(user.id) : await adminService.banUser(user.id);
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const removeCue = async (id) => {
    await cueService.deleteCue(id);
    setCues((s) => s.filter((c) => c.id !== id));
  };

  const flagCue = async (id) => {
    // For demo: just add a 'flagged' property via updateCue
    const res = await cueService.updateCue(id, { flagged: true });
    setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
  };

  return (
    <Box fill background="background">
      <Box pad="medium" direction="row" align="center" gap="small">
        <Button 
          icon={<FormPrevious />} 
          label="Back" 
          onClick={onBack}
          plain
        />
        <Heading level="2" margin="none">Admin — User Management</Heading>
      </Box>

      <Box pad="medium">
        <Grid columns={['flex', 'flex']} gap="medium">
          <Card background="white">
            <CardBody pad="medium">
              <Heading level="3" margin={{ bottom: 'medium' }}>Users</Heading>
              <DataTable
                columns={[
                  {
                    property: 'name',
                    header: <Text weight="bold">Name</Text>,
                    primary: true,
                    render: datum => (
                      <Box>
                        <Text weight="bold">{datum.name}</Text>
                        <Text size="small" color="dark-3">{datum.email}</Text>
                      </Box>
                    )
                  },
                  {
                    property: 'status',
                    header: <Text weight="bold">Status</Text>,
                    render: datum => datum.banned ? (
                      <Box background="status-error" pad="xsmall" round="xsmall" width="fit-content">
                        <Text size="small" color="white">BANNED</Text>
                      </Box>
                    ) : (
                      <Box background="status-ok" pad="xsmall" round="xsmall" width="fit-content">
                        <Text size="small" color="white">ACTIVE</Text>
                      </Box>
                    )
                  },
                  {
                    property: 'actions',
                    header: <Text weight="bold">Actions</Text>,
                    render: datum => (
                      <Button
                        icon={datum.banned ? <StatusGood /> : <Close />}
                        label={datum.banned ? 'Unban' : 'Ban'}
                        onClick={() => toggleBan(datum)}
                        size="small"
                      />
                    )
                  }
                ]}
                data={users}
              />
            </CardBody>
          </Card>

          <Card background="white">
            <CardBody pad="medium">
              <Heading level="3" margin={{ bottom: 'medium' }}>Cues</Heading>
              <DataTable
                columns={[
                  {
                    property: 'title',
                    header: <Text weight="bold">Cue</Text>,
                    primary: true,
                    render: datum => (
                      <Box>
                        <Text weight="bold">{datum.make} {datum.model}</Text>
                        <Text size="small" color="dark-3">${datum.price.toFixed(2)}</Text>
                      </Box>
                    )
                  },
                  {
                    property: 'status',
                    header: <Text weight="bold">Status</Text>,
                    render: datum => datum.flagged ? (
                      <Box background="accent-2" pad="xsmall" round="xsmall" width="fit-content">
                        <Text size="small" color="white">FLAGGED</Text>
                      </Box>
                    ) : null
                  },
                  {
                    property: 'actions',
                    header: <Text weight="bold">Actions</Text>,
                    render: datum => (
                      <Box direction="row" gap="xsmall">
                        <Button
                          icon={<Flag />}
                          onClick={() => flagCue(datum.id)}
                          size="small"
                          tip="Flag"
                        />
                        <Button
                          icon={<Trash />}
                          onClick={() => removeCue(datum.id)}
                          size="small"
                          tip="Delete"
                        />
                      </Box>
                    )
                  }
                ]}
                data={cues}
              />
            </CardBody>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}
