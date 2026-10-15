import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Field from '../../../components/ui/Field';
import Modal from '../../../components/ui/Modal';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

function GroupModal({ group, onClose }) {
  const { stores, groups, saveGroup } = useApp();
  const isNew = !group.id;
  const [name, setName] = useState(group.name || '');
  const [picked, setPicked] = useState(stores.filter((s) => s.groupId === group.id).map((s) => s.id));
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    if (groups.some((g) => g.name.toLowerCase() === name.trim().toLowerCase() && g.id !== group.id)) return setError('A group with this name exists.');
    saveGroup({ ...group, name: name.trim() }, picked, isNew);
    return onClose();
  };

  return (
    <Modal
      title={isNew ? 'New store group' : `Edit ${group.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="group-form" variant="primary">
            Save
          </Button>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} className="space-y-4">
        <Field label="Group name" error={error}>
          <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home & Garden" />
        </Field>
        <div>
          <span className={ui.label}>Stores in this group</span>
          <p className={`mb-2 text-xs ${ui.muted}`}>Checking a store moves it here from its current group. To take a store out, add it to another group.</p>
          <div className={`rounded-lg border border-gray-200 dark:border-gray-800 ${ui.divide}`}>
            {stores.map((s) => {
              // A store can't leave its group from here, so it has somewhere to belong.
              const locked = s.groupId === group.id && !isNew;
              return (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${locked ? '' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={picked.includes(s.id)}
                    onChange={() => setPicked((ids) => (ids.includes(s.id) ? ids.filter((x) => x !== s.id) : [...ids, s.id]))}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span className={`flex-1 ${ui.h}`}>{s.name}</span>
                  <span className={`text-xs ${ui.muted}`}>{groups.find((g) => g.id === s.groupId)?.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function GroupsTab() {
  const { groups, stores, team, deleteGroup, askConfirm } = useApp();
  const [editing, setEditing] = useState(null);

  return (
    <Card
      title="Store groups"
      action={
        <Button variant="primary" size="sm" onClick={() => setEditing({})}>
          <Plus size={13} /> New group
        </Button>
      }
    >
      <p className={`px-4 pt-4 text-sm sm:px-5 ${ui.muted}`}>Managers see the stores in their group. Each store belongs to one group.</p>
      <ul className={`mt-2 ${ui.divide}`}>
        {groups.map((g) => {
          const groupStores = stores.filter((s) => s.groupId === g.id);
          const managers = team.filter((m) => m.groupId === g.id);
          const inUse = groupStores.length || managers.length;
          return (
            <li key={g.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${ui.h}`}>{g.name}</p>
                <p className={`text-xs ${ui.muted}`}>{groupStores.length ? groupStores.map((s) => s.name).join(', ') : 'No stores yet'}</p>
                <p className={`mt-0.5 text-xs ${ui.muted}`}>Managers: {managers.length ? managers.map((m) => m.name).join(', ') : 'none'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditing(g)}>
                  <Pencil size={12} /> Edit
                </Button>
                <Button
                  size="sm"
                  className="text-red-700 dark:text-red-400"
                  onClick={() =>
                    inUse
                      ? askConfirm({
                          title: 'Group still in use',
                          body: 'Move its stores and managers to another group first.',
                          confirmLabel: 'OK',
                          tone: 'neutral',
                          onConfirm: () => {},
                        })
                      : askConfirm({ title: `Delete ${g.name}?`, body: 'This group is empty and will be removed.', onConfirm: () => deleteGroup(g) })
                  }
                >
                  <Trash2 size={12} /> Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {editing && <GroupModal group={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
