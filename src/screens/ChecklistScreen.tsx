import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  addChecklistItem,
  deleteChecklistItem,
  getChecklist,
  resetChecklist,
  setChecklistItemDone,
} from '../checklists/checklistRepository';
import { getActiveDroneProfile } from '../droneProfiles/droneProfileRepository';
import { generateId } from '../ids';
import type { ChecklistEntry, DroneProfile } from '../weather/types';
import { Button, Card, MetaLabel } from '../ui/components';

/**
 * The flying DroneProfile's Checklist: the GenericChecklist plus that profile's
 * own items. Ticks persist and only ever clear through the explicit Reset
 * action — never off the back of the weather or Verdict flow (CONTEXT.md).
 */
export function ChecklistScreen({
  onCreateDroneProfile,
}: {
  onCreateDroneProfile: () => void;
}) {
  const [profile, setProfile] = useState<DroneProfile | null | undefined>(
    undefined,
  );
  const [items, setItems] = useState<ChecklistEntry[]>([]);
  const [draft, setDraft] = useState('');

  const reload = useCallback(async (profileId: string) => {
    setItems(await getChecklist(profileId));
  }, []);

  useEffect(() => {
    getActiveDroneProfile()
      .then(loaded => {
        setProfile(loaded);
        if (loaded) {
          reload(loaded.id);
        }
      })
      .catch(() => setProfile(null));
  }, [reload]);

  if (profile === undefined) {
    return <View className="flex-1 bg-background" testID="checklist-loading" />;
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center gap-3 bg-background px-8 py-14">
        <Text
          className="text-center text-[13px] leading-5 text-muted-foreground"
          testID="checklist-no-profile"
        >
          Each drone keeps its own checklist. Add a drone to start ticking items
          off.
        </Text>
        <Button
          label="Add a Drone"
          size="sm"
          onPress={onCreateDroneProfile}
          testID="checklist-create-profile"
        />
      </View>
    );
  }

  const flying = profile;
  const doneCount = items.filter(item => item.done).length;
  const percent = items.length
    ? Math.round((doneCount / items.length) * 100)
    : 0;
  const allDone = items.length > 0 && doneCount === items.length;

  async function handleToggle(item: ChecklistEntry) {
    await setChecklistItemDone(flying.id, item.id, !item.done);
    await reload(flying.id);
  }

  async function handleDelete(item: ChecklistEntry) {
    await deleteChecklistItem(flying.id, item.id);
    await reload(flying.id);
  }

  async function handleAdd() {
    const label = draft.trim();
    if (!label) {
      return;
    }
    await addChecklistItem(flying.id, { id: generateId(), label });
    setDraft('');
    await reload(flying.id);
  }

  async function handleReset() {
    await resetChecklist(flying.id);
    await reload(flying.id);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-8"
      testID="checklist-screen"
    >
      <View className="flex-row items-center gap-2.5">
        <View className="h-1 flex-1 overflow-hidden bg-muted">
          <View
            className={`h-full ${allDone ? 'bg-primary' : 'bg-muted-foreground'}`}
            style={{ width: `${percent}%` }}
            testID="checklist-progress-bar"
          />
        </View>
        <Text
          className="font-mono text-[10.5px] tabular-nums text-muted-foreground"
          testID="checklist-progress"
        >
          {doneCount}/{items.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: doneCount === 0 }}
          disabled={doneCount === 0}
          onPress={handleReset}
          testID="checklist-reset"
          className={`border border-border bg-background px-2 py-1.5 ${
            doneCount === 0 ? 'opacity-40' : ''
          }`}
        >
          <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
            Reset
          </Text>
        </Pressable>
      </View>

      <MetaLabel className="mt-3">{flying.name}</MetaLabel>

      <View className="mt-3 gap-1.5">
        {items.map(item => (
          <Card
            key={item.id}
            className="flex-row items-center gap-2.5 p-3"
            testID={`checklist-item-${item.id}`}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              onPress={() => handleToggle(item)}
              testID={`checklist-toggle-${item.id}`}
              className={`h-5 w-5 items-center justify-center border ${
                item.done
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground bg-transparent'
              }`}
            >
              {item.done && (
                <Text className="text-[12px] font-bold text-primary-foreground">
                  ✓
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="min-w-0 flex-1"
              onPress={() => handleToggle(item)}
            >
              <Text
                className={`text-[13.5px] ${
                  item.done
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>

            {!item.generic && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.label}`}
                onPress={() => handleDelete(item)}
                testID={`checklist-delete-${item.id}`}
                className="px-1"
              >
                <Text className="text-[13px] text-muted-foreground">✕</Text>
              </Pressable>
            )}
          </Card>
        ))}
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <TextInput
          className="flex-1 border border-input bg-card px-3 py-2.5 text-[14px] text-foreground"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          placeholder="Add your own item…"
          testID="checklist-new-item"
        />
        <Button
          label="Add"
          size="sm"
          onPress={handleAdd}
          disabled={!draft.trim()}
          testID="checklist-add-item"
        />
      </View>
    </ScrollView>
  );
}
