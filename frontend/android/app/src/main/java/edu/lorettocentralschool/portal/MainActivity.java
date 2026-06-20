package edu.lorettocentralschool.portal;

import android.graphics.Color;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        getWindow().setBackgroundDrawableResource(R.color.splash_bg);
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#051A1A"));
        getWindow().setNavigationBarColor(Color.parseColor("#051A1A"));
    }
}
