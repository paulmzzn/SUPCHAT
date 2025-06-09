import React, { memo } from 'react';
import { View, Text, Image } from 'react-native';

const UserAvatar = memo(({ user, style, placeholderStyle, textStyle }) => {
  if (!user) return <View style={style} />;

  if (user.photo_de_profil || user.avatar) {
    return (
      <Image
        source={{ uri: user.photo_de_profil || user.avatar }}
        style={style}
        onError={(e) => console.log("Avatar image failed to load")}
      />
    );
  } else {
    return (
      <View style={placeholderStyle}>
        <Text style={textStyle}>
          {(user.nom || user.name || "U")[0].toUpperCase()}
        </Text>
      </View>
    );
  }
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
