import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Heading, Text, Card, CardBody, DataTable, Grid, TextInput, Tabs, Tab, Tag, Layer, Form, FormField, Select } from 'grommet';
import { FormPrevious, Trash, Flag, Close, StatusGood, Edit, UserAdmin } from 'grommet-icons';
import MaterialInput from './MaterialInput';
import * as adminUsers from '../api/adminUsersService';
import * as cueService from '../api/cueService';
import * as cueCaseService from '../api/cueCaseService';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    async function load() {
      console.log('AdminPage: Loading data...');
      try {
        const [u, c, k] = await Promise.all([
          adminUsers.getAllUsers().catch(err => { console.error('Error loading users:', err); return []; }),
          cueService.getCues().catch(err => { console.error('Error loading cues:', err); return []; }),
          cueCaseService.getCueCases().catch(err => { console.error('Error loading cases:', err); return []; })
        ]);
        console.log('AdminPage: Users loaded:', u?.length || 0, u);
        console.log('AdminPage: Cues loaded:', c?.length || 0, c);
        console.log('AdminPage: Cases loaded:', k?.length || 0, k);
        setUsers(u || []);
        setCues(c || []);
        setCases(k || []);
      } catch (error) {
        console.error('AdminPage: Fatal error loading data:', error);
        setUsers([]);
        setCues([]);
        setCases([]);
      }
    }
    load();
  }, []);

  const listings = useMemo(() => {
    const cueItems = (cues || []).map(x => ({
      id: x.id,
      uid: `cue-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.model ?? ''}`.trim() || `Cue #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'cue',
      flagged: x.flagged || false,
    }));
    const caseItems = (cases || []).map(x => ({
      id: x.id,
      uid: `case-${x.id}`,
      title: x.title || `${x.brand ?? ''} ${x.type ?? ''}`.trim() || `Case #${x.id}`,
      price: Number(x.price ?? 0),
      itemType: 'case',
      flagged: x.flagged || false,
    }));
    return [...cueItems, ...caseItems];
  }, [cues, cases]);

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(l =>
      !q || l.title.toLowerCase().includes(q) || String(l.price).includes(q)
    );
  }, [listings, query]);

  const toggleBan = async (user) => {
    const updated = await adminUsers.updateUser(user.id, { IsActive: user.isActive === false ? true : false });
    setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
  };

  const saveUser = async () => {
    if (!editingUser) return;
  const updated = await adminUsers.updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
    });
    if (updated) {
      setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    }
  };

  const deleteUser = async (id) => {
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  };

  const removeListing = async (item) => {
    if (item.itemType === 'cue') {
      await cueService.deleteCue(item.id);
      setCues((s) => s.filter((c) => c.id !== item.id));
    } else {
      await cueCaseService.deleteCueCase(item.id);
      setCases((s) => s.filter((c) => c.id !== item.id));
    }
  };

  const flagListing = async (item) => {
    if (item.itemType === 'cue') {
      const res = await cueService.updateCue(item.id, { flagged: true });
      setCues((s) => s.map((c) => (c.id === res.id ? res : c)));
    } else {
      const res = await cueCaseService.updateCueCase(item.id, { flagged: true });
      setCases((s) => s.map((c) => (c.id === res.id ? res : c)));
    }
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
        <Heading level="2" margin="none">Admin — Dashboard</Heading>
      </Box>

      <Box pad="medium">
        <Grid columns={['1fr', '1fr']} gap="medium">
          <Card background="white" height={{ min: 'large' }}>
            <CardBody pad="medium">
              <Heading level="3" margin={{ bottom: 'medium' }}>Users</Heading>
              <Box direction="row" gap="small" align="center" margin={{ bottom: 'small' }}>
                <MaterialInput
                  placeholder="Search users (name or email)"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  size="small"
                  style={{ minWidth: '250px' }}
                />
                <Tag value={`Total: ${users.length}`} />
                <Tag value={`Filtered: ${users.filter(u => {
                  const q = userQuery.trim().toLowerCase();
                  return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                }).length}`} />
              </Box>
              <DataTable
                primaryKey="id"
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
                    property: 'role',
                    header: <Text weight="bold">Role</Text>,
                    render: d => (
                      <Box background={d.role === 'admin' ? 'accent-3' : 'background-back'} pad="xsmall" round="xsmall" width="fit-content">
                        <Box direction="row" gap="xsmall" align="center">
                          <UserAdmin size="small" />
                          <Text size="small">{d.role}</Text>
                        </Box>
                      </Box>
                    )
                  },
                  {
                    property: 'status',
                    header: <Text weight="bold">Status</Text>,
                    render: datum => datum.isActive === false ? (
                      <Box background="status-error" pad="xsmall" round="xsmall" width="fit-content">
                        <Text size="small" color="white">INACTIVE</Text>
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
                    size: 'auto',
                    render: datum => (
                      <Box direction="row" gap="xsmall" flex={false} wrap={false} style={{ minWidth: '280px' }}>
                        <Button icon={<Edit />} size="small" tip="Edit" onClick={() => setEditingUser({ ...datum })} />
                        <Button 
                          icon={datum.isActive === false ? <StatusGood /> : <Close />} 
                          label={datum.isActive === false ? 'Activate' : 'Disable'} 
                          onClick={() => toggleBan(datum)} 
                          size="small" 
                        />
                        <Button icon={<Trash />} size="small" tip="Delete" onClick={() => deleteUser(datum.id)} />
                      </Box>
                    )
                  }
                ]}
                data={users.filter(u => {
                  const q = userQuery.trim().toLowerCase();
                  return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                })}
                step={10}
                paginate
              />
            </CardBody>
          </Card>

          <Card background="white" height={{ min: 'large' }}>
            <CardBody pad="medium">
              <Heading level="3" margin={{ bottom: 'medium' }}>Listings</Heading>
              <Box direction="row" gap="small" align="center" margin={{ bottom: 'small' }}>
                <MaterialInput
                  placeholder="Search listings (title or price)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  size="small"
                  style={{ minWidth: '250px' }}
                />
                <Tag value={`Total: ${listings.length}`} />
                <Tag value={`Filtered: ${filteredListings.length}`} />
              </Box>
      <Tabs>
                <Tab title="All">
                  <DataTable
                    primaryKey="uid"
                    columns={[
                      {
                        property: 'title',
                        header: <Text weight="bold">Title</Text>,
                        sortable: true,
                        primary: true,
                        render: datum => (
                          <Box direction="row" gap="small" align="center">
                            <Tag value={datum.itemType.toUpperCase()} />
                            <Text weight="bold">{datum.title}</Text>
                          </Box>
                        )
                      },
                      {
                        property: 'price',
                        header: <Text weight="bold">Price (€)</Text>,
                        sortable: true,
                        render: datum => (
                          <Text size="small" color="dark-3">€{Number(datum.price || 0).toFixed(2)}</Text>
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
                            <Button icon={<Flag />} onClick={() => flagListing(datum)} size="small" tip="Flag" />
                            <Button icon={<Trash />} onClick={() => removeListing(datum)} size="small" tip="Delete" />
                          </Box>
                        )
                      }
                    ]}
                    data={filteredListings}
        step={10}
        paginate
                  />
                </Tab>
                <Tab title="Cues">
                  <DataTable
                    primaryKey="uid"
                    columns={[
                      { property: 'title', header: <Text weight="bold">Title</Text>, primary: true },
                      { property: 'price', header: <Text weight="bold">Price (€)</Text>, sortable: true, render: d => <Text size="small">€{Number(d.price||0).toFixed(2)}</Text> },
                      { property: 'status', header: <Text weight="bold">Status</Text>, render: d => d.flagged ? (<Box background="accent-2" pad="xsmall" round="xsmall" width="fit-content"><Text size="small" color="white">FLAGGED</Text></Box>) : null },
                      { property: 'actions', header: <Text weight="bold">Actions</Text>, render: d => (<Box direction="row" gap="xsmall"><Button icon={<Flag />} onClick={() => flagListing(d)} size="small" tip="Flag" /><Button icon={<Trash />} onClick={() => removeListing(d)} size="small" tip="Delete" /></Box>) }
                    ]}
                    data={filteredListings.filter(l => l.itemType === 'cue')}
                    step={10}
                    paginate
                  />
                </Tab>
                <Tab title="Cases">
                  <DataTable
                    primaryKey="uid"
                    columns={[
                      { property: 'title', header: <Text weight="bold">Title</Text>, primary: true },
                      { property: 'price', header: <Text weight="bold">Price (€)</Text>, sortable: true, render: d => <Text size="small">€{Number(d.price||0).toFixed(2)}</Text> },
                      { property: 'status', header: <Text weight="bold">Status</Text>, render: d => d.flagged ? (<Box background="accent-2" pad="xsmall" round="xsmall" width="fit-content"><Text size="small" color="white">FLAGGED</Text></Box>) : null },
                      { property: 'actions', header: <Text weight="bold">Actions</Text>, render: d => (<Box direction="row" gap="xsmall"><Button icon={<Flag />} onClick={() => flagListing(d)} size="small" tip="Flag" /><Button icon={<Trash />} onClick={() => removeListing(d)} size="small" tip="Delete" /></Box>) }
                    ]}
                    data={filteredListings.filter(l => l.itemType === 'case')}
                    step={10}
                    paginate
                  />
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </Grid>
      </Box>

      {editingUser && (
        <Layer onEsc={() => setEditingUser(null)} onClickOutside={() => setEditingUser(null)}>
          <Box pad="medium" gap="small" width="medium">
            <Heading level="3" margin="none">Edit User</Heading>
            <Form onSubmit={saveUser}>
              <FormField name="name" label="Name">
                <TextInput name="name" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
              </FormField>
              <FormField name="email" label="Email">
                <TextInput name="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
              </FormField>
              <FormField name="role" label="Role">
                <Select name="role" options={["user", "admin"]} value={editingUser.role} onChange={({ option }) => setEditingUser({ ...editingUser, role: option })} />
              </FormField>
              <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
                <Button label="Cancel" onClick={() => setEditingUser(null)} />
                <Button primary label="Save" onClick={saveUser} />
              </Box>
            </Form>
          </Box>
        </Layer>
      )}
    </Box>
  );
}
