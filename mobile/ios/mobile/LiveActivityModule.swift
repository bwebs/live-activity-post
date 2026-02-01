import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: RCTEventEmitter {

  override func supportedEvents() -> [String]! {
    return ["onActivityToken"]
  }

  @objc(startActivity)
  func startActivity() {
    // In a real app, you might want to verify authorization first.
    // For iOS 16.1+, ActivityAuthorizationInfo().areActivitiesEnabled

    let attributes = LiveActivityAttributes(name: "MyActivity")
    let contentState = LiveActivityAttributes.ContentState(
        headline: "Welcome",
        statusText: "Waiting for updates...",
        progress: 0.0
    )

    do {
        if #available(iOS 16.1, *) {
            let activity = try Activity<LiveActivityAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: .token
            )

            Task {
                for await data in activity.pushTokenUpdates {
                    let token = data.map {String(format: "%02x", $0)}.joined()
                    print("Live Activity Push Token: \(token)")
                    self.sendEvent(withName: "onActivityToken", body: ["token": token])
                }
            }
        } else {
            print("Live Activities are not supported on this version of iOS")
        }
    } catch {
        print("Error starting activity: \(error.localizedDescription)")
    }
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
