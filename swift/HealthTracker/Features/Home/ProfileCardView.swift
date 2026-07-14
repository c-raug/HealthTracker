import SwiftUI
import UIKit

/// The summary card at the top of the Home dashboard. Port of
/// `expo/components/profile/ProfileCard.tsx`: an accent-ringed avatar (photo → initials → person
/// icon) with a red recap dot when this week's recap is unseen, the profile name, and the gamified
/// level label (⭐ / prestige + `XP.levelLabel`). Tapping the avatar opens the weekly recap; tapping
/// the name or chevron opens the Edit-Profile screen. Uses the shared iOS-26 `featureCardStyle`.
///
/// The label helpers are pure in `HomeStats`; presentation only here.
struct ProfileCardView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    /// Avatar tap → weekly recap (RN `router.push('/weekly-recap-modal')`).
    var onOpenRecap: () -> Void
    /// Name / chevron tap → Edit Profile (RN `router.push('/profile-modal')`).
    var onOpenProfile: () -> Void

    private static let avatarSize: CGFloat = 72
    private static let ringBorder: CGFloat = 3
    private static let ringGap: CGFloat = 3
    private static let ringSize = avatarSize + (ringBorder + ringGap) * 2
    private static let badgeSize: CGFloat = 12

    private var profile: UserProfile? { store.preferences.profile }
    private var displayName: String {
        if let name = profile?.name, !name.isEmpty { return name }
        return "Your Profile"
    }
    private var initials: String? { HomeStats.initials(from: profile?.name) }
    private var levelLabel: String {
        HomeStats.levelLabel(
            prestige: store.preferences.prestige ?? 0,
            totalXp: store.preferences.totalXp ?? 0
        )
    }
    private var showRecapBadge: Bool {
        HomeStats.showRecapBadge(lastRecapShownWeek: store.preferences.lastRecapShownWeek)
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            Button(action: onOpenRecap) {
                avatar
            }
            .buttonStyle(.plain)

            Button(action: onOpenProfile) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(displayName)
                        .font(Typography.h3)
                        .foregroundStyle(colors.text)
                    Text(levelLabel)
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Button(action: onOpenProfile) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 18))
                    .foregroundStyle(colors.textSecondary)
                    .padding(.leading, Spacing.xs)
            }
            .buttonStyle(.plain)
        }
        .featureCardStyle()
    }

    private var avatar: some View {
        ZStack(alignment: .topTrailing) {
            Circle()
                .strokeBorder(colors.primary, lineWidth: Self.ringBorder)
                .frame(width: Self.ringSize, height: Self.ringSize)
                .overlay {
                    avatarContent
                        .frame(width: Self.avatarSize, height: Self.avatarSize)
                        .background(colors.background)
                        .clipShape(Circle())
                }

            if showRecapBadge {
                Circle()
                    .fill(Color(hex: "#FF3B30"))
                    .frame(width: Self.badgeSize, height: Self.badgeSize)
                    .overlay(Circle().strokeBorder(colors.card, lineWidth: 1.5))
            }
        }
        .frame(width: Self.ringSize, height: Self.ringSize)
    }

    @ViewBuilder
    private var avatarContent: some View {
        if let image = AvatarImage.load(store.preferences.avatarUri) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
        } else if let initials {
            Text(initials)
                .font(Typography.h2.weight(.bold))
                .foregroundStyle(colors.primary)
        } else {
            Image(systemName: "person.fill")
                .font(.system(size: 36))
                .foregroundStyle(colors.textSecondary)
        }
    }
}

/// Best-effort avatar loader. Backups from the Expo app can carry an `avatarUri` that is a `file://`
/// path (from the old sandbox) or a `data:` URI; native photo-picking arrives in Phase 11. Any URI
/// that can't be resolved falls back to initials/person icon in the card.
enum AvatarImage {
    static func load(_ uri: String?) -> UIImage? {
        guard let uri, !uri.isEmpty else { return nil }
        if uri.hasPrefix("data:") {
            guard let commaRange = uri.range(of: ","),
                  let data = Data(base64Encoded: String(uri[commaRange.upperBound...])) else { return nil }
            return UIImage(data: data)
        }
        if let url = URL(string: uri), url.isFileURL {
            return (try? Data(contentsOf: url)).flatMap(UIImage.init(data:))
        }
        return UIImage(contentsOfFile: uri)
    }
}
