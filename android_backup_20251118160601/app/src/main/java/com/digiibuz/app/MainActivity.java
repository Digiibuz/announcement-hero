package com.digiibuz.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private Uri pendingUrl = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Capturer l'URL de l'intent au démarrage
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        String action = intent.getAction();
        Uri data = intent.getData();

        Log.d(TAG, "📱 handleIntent - action: " + action + ", data: " + data);

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String url = data.toString();
            Log.d(TAG, "🔗 Deep link URL captured: " + url);
            
            // Si le bridge n'est pas encore prêt, stocker l'URL
            if (bridge == null) {
                Log.d(TAG, "⏳ Bridge not ready, storing URL for later");
                pendingUrl = data;
            } else {
                // Bridge prêt, envoyer immédiatement
                Log.d(TAG, "✅ Bridge ready, handling URL immediately");
                notifyAppUrlOpen(url);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        
        // Si on a une URL en attente et que le bridge est maintenant prêt
        if (pendingUrl != null && bridge != null) {
            String url = pendingUrl.toString();
            Log.d(TAG, "🚀 Bridge now ready, sending pending URL: " + url);
            notifyAppUrlOpen(url);
            pendingUrl = null;
        }
    }

    private void notifyAppUrlOpen(String url) {
        Log.d(TAG, "📢 Notifying app of URL: " + url);
        // L'événement sera géré par le plugin App de Capacitor
    }
}
