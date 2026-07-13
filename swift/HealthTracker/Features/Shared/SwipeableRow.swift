import SwiftUI

/// A row that reveals a single trailing action when swiped left — the SwiftUI stand-in for RN's
/// `react-native-gesture-handler` `Swipeable` (used by the food rows, meal-category headers, and
/// saved-meal group headers, none of which live in a `List`, so `.swipeActions` isn't available).
///
/// Conservative by design: a horizontal `DragGesture` (min distance 18 pt so vertical scrolling and
/// the calorie pager win first) reveals a fixed-width action; releasing past the halfway point snaps
/// it open, otherwise closed. **Flag for on-device tuning** if the gesture feels grabby next to the
/// scroll view — this is the spot to adjust (like the Phase 6 count-up note).
struct SwipeableRow<Content: View, ActionLabel: View>: View {
    var actionColor: Color
    var actionWidth: CGFloat = 80
    var onAction: () -> Void
    @ViewBuilder var actionLabel: () -> ActionLabel
    @ViewBuilder var content: () -> Content

    @State private var offset: CGFloat = 0
    @GestureState private var dragTranslation: CGFloat = 0

    private var currentOffset: CGFloat {
        min(0, max(-actionWidth, offset + dragTranslation))
    }

    var body: some View {
        ZStack(alignment: .trailing) {
            Button {
                close()
                onAction()
            } label: {
                actionLabel()
                    .frame(width: actionWidth)
                    .frame(maxHeight: .infinity)
                    .background(actionColor)
            }
            .buttonStyle(.plain)

            content()
                .frame(maxWidth: .infinity)
                .offset(x: currentOffset)
                .gesture(
                    DragGesture(minimumDistance: 18)
                        .updating($dragTranslation) { value, state, _ in
                            // Only react to a dominantly-horizontal left drag.
                            if abs(value.translation.width) > abs(value.translation.height) {
                                state = value.translation.width
                            }
                        }
                        .onEnded { value in
                            let projected = offset + value.translation.width
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                offset = projected < -actionWidth / 2 ? -actionWidth : 0
                            }
                        }
                )
        }
        .clipped()
    }

    private func close() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) { offset = 0 }
    }
}
