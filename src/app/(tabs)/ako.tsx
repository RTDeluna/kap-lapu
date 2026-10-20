import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { InfoIcon, LockSimpleIcon, SignOutIcon, TrashIcon, UserCircleIcon } from '@/components/icons';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/data/auth';
import { useMyProfile, useUpdateDisplayName } from '@/data/profile';
import { errorMessage, supabase } from '@/data/supabase';

export default function AkoScreen() {
  const { userId, loading } = useAuth();
  const router = useRouter();
  const { theme } = useUnistyles();

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={theme.colors.dagat} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="titleLg" accessibilityRole="header">
        Ako
      </AppText>
      {userId ? (
        <SignedIn />
      ) : (
        <View style={styles.card}>
          <UserCircleIcon size={40} color={theme.colors.dagat} weight="duotone" />
          <AppText>Mag sign in para mag pin ng spot, mag log ng huli, at mag message sa bangka.</AppText>
          <Button label="Sign in" tone="primary" size="large" onPress={() => router.push('/sign-in')} />
        </View>
      )}
      <View>
        <ListRow
          title="Terms"
          icon={(c) => <InfoIcon size={20} color={c} />}
          onPress={() => router.push('/terms')}
        />
        <ListRow
          title="Privacy"
          icon={(c) => <LockSimpleIcon size={20} color={c} />}
          onPress={() => router.push('/privacy')}
        />
      </View>
    </Screen>
  );
}

function SignedIn() {
  const profile = useMyProfile();
  const updateName = useUpdateDisplayName();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState(false);

  const p = profile.data;

  const startEdit = () => {
    setName(p?.display_name ?? '');
    setEditing(true);
  };
  const save = () => updateName.mutate(name, { onSuccess: () => setEditing(false) });

  // TODO(stage-1 follow up): call the delete-account Edge Function once it ships.
  // Until then this is a placeholder that only tells the person how to ask support.
  const requestDelete = () => setDeleteNotice(true);

  return (
    <>
      <View style={styles.card}>
        {profile.isPending ? (
          <ActivityIndicator />
        ) : (
          <>
            <AppText variant="title">{p?.display_name || 'Walang pangalan pa'}</AppText>
            <AppText variant="bodySm" tone="muted">
              @{p?.handle ?? ''}
            </AppText>
          </>
        )}
        {editing ? (
          <View style={styles.edit}>
            <TextField
              label="Display name"
              value={name}
              onChangeText={setName}
              maxLength={60}
              autoFocus
              error={updateName.error ? errorMessage(updateName.error) : null}
            />
            <View style={styles.row}>
              <Button label="Cancel" fill onPress={() => setEditing(false)} />
              <Button label="Save" tone="primary" fill loading={updateName.isPending} onPress={save} />
            </View>
          </View>
        ) : (
          <Button label="Edit display name" onPress={startEdit} />
        )}
      </View>

      <View>
        <ListRow
          title="Sign out"
          icon={(c) => <SignOutIcon size={20} color={c} />}
          onPress={() => void supabase.auth.signOut()}
        />
        <ListRow
          title="Delete my account"
          tone="danger"
          icon={(c) => <TrashIcon size={20} color={c} />}
          onPress={() => {
            setDeleteNotice(false);
            setDeleteOpen(true);
          }}
        />
      </View>

      <ConfirmSheet visible={deleteOpen} title="Delete my account?" onClose={() => setDeleteOpen(false)}>
        {deleteNotice ? (
          <>
            <Banner>Email support@laot.app to delete for now.</Banner>
            <Button label="OK" onPress={() => setDeleteOpen(false)} />
          </>
        ) : (
          <>
            <AppText>
              Mabubura ang profile mo, mga spot at mga huli. Hindi na ito maibabalik.
            </AppText>
            <Button
              label="Delete my account"
              tone="danger"
              icon={(c) => <TrashIcon size={20} color={c} />}
              onPress={requestDelete}
            />
            <Button label="Huwag na" tone="quiet" onPress={() => setDeleteOpen(false)} />
          </>
        )}
      </ConfirmSheet>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.space[3],
    padding: theme.space[5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceRaised,
  },
  edit: { gap: theme.space[3] },
  row: { flexDirection: 'row', gap: theme.space[2] },
}));
