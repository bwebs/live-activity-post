import ActivityKit
import WidgetKit
import SwiftUI

struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var headline: String
        var statusText: String
        var progress: Double
    }

    var name: String
}
