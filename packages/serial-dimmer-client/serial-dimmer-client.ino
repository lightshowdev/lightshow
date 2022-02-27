#include <TimerOne.h>
#include <string.h>

unsigned char channel_1 = 4;  // Output to Opto Triac pin, channel 1
unsigned char channel_2 = 5;  // Output to Opto Triac pin, channel 2
unsigned char channel_3 = 6;  // Output to Opto Triac pin, channel 3
unsigned char channel_4 = 7;  // Output to Opto Triac pin, channel 4
unsigned char channel_5 = 8;  // Output to Opto Triac pin, channel 5
unsigned char channel_6 = 9;  // Output to Opto Triac pin, channel 6
unsigned char channel_7 = 10; // Output to Opto Triac pin, channel 7
unsigned char channel_8 = 11; // Output to Opto Triac pin, channel 8
unsigned char CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8;
unsigned char CHANNEL_SELECT;
unsigned char i = 0;
unsigned char clock_tick; // variable for Timer1

unsigned char CH[] = {CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8};

const unsigned int MAX_MESSAGE_LENGTH = 14;
const unsigned int MIN_LUX = 95;
const unsigned int LOW_LUX = 85;
const unsigned int MAX_LUX = 30;
const unsigned int HIGH_LUX = 35;

// Storage vars

char channels[4];
char start_brightness_str[3];
char end_brightness_str[3];
char auto_off_str[2];
char slide_time_str[5];

unsigned int message_pos = 0;
unsigned int channels_pos = 0;
unsigned int start_brightness_pos = 0;
unsigned int end_brightness_pos = 0;
unsigned int auto_off_pos = 0;
unsigned int slide_time_pos = 0;

void setup()
{

  // CH1=CH2=CH3=CH4=CH5=CH6=CH7=CH8=high;

  pinMode(channel_1, OUTPUT); // Set AC Load pin as output
  pinMode(channel_2, OUTPUT); // Set AC Load pin as output
  pinMode(channel_3, OUTPUT); // Set AC Load pin as output
  pinMode(channel_4, OUTPUT); // Set AC Load pin as output
  pinMode(channel_5, OUTPUT); // Set AC Load pin as output
  pinMode(channel_6, OUTPUT); // Set AC Load pin as output
  pinMode(channel_7, OUTPUT); // Set AC Load pin as output
  pinMode(channel_8, OUTPUT); // Set AC Load pin as output
  attachInterrupt(1, zero_crosss_int, RISING);
  Timer1.initialize(83);            // set a timer of length 100 microseconds for 50Hz or 83 microseconds for 60Hz;
  Timer1.attachInterrupt(timerIsr); // attach the service routine here
  Serial.begin(256000);
}

void loop()
{
  // <channels>|start|end|time
  while (Serial.available() > 0)
  {
    char inByte = Serial.read();
    if (inByte != '\n' && (message_pos < MAX_MESSAGE_LENGTH - 1))
    {
      if (message_pos < 3)
      {
        channels[channels_pos] = inByte;
        channels_pos++;
      }
      else if (message_pos < 5)
      {
        start_brightness_str[start_brightness_pos] = inByte;
        start_brightness_pos++;
      }
      else if (message_pos < 7)
      {
        end_brightness_str[end_brightness_pos] = inByte;
        end_brightness_pos++;
      }
      else if (message_pos < 8)
      {
        auto_off_str[auto_off_pos] = inByte;
        auto_off_pos++;
      }
      else if (message_pos < 12)
      {
        slide_time_str[slide_time_pos] = inByte;
        slide_time_pos++;
      }

      message_pos++;
    }
    else
    {
      unsigned long timeBegin = micros();
      channels[channels_pos + 1] = '\0';
      start_brightness_str[start_brightness_pos + 1] = '\0';
      end_brightness_str[end_brightness_pos + 1] = '\0';
      auto_off_str[auto_off_pos + 1] = '\0';
      slide_time_str[slide_time_pos + 1] = '\0';

      unsigned int start_brightness = atoi(start_brightness_str);
      unsigned int end_brightness = atoi(end_brightness_str);
      unsigned int slide_time = atoi(slide_time_str);
      unsigned int auto_off = atoi(auto_off_str);
      unsigned int channel_bits = atoi(channels);

      resetStorage();

      if (start_brightness > end_brightness)
      {

        float increments1 = slide_time / (start_brightness - end_brightness);
        // Serial.println(increments1);

        if (slide_time <= 2 && end_brightness <= HIGH_LUX)
        {
          toggleChannels(1, channel_bits);
          delay(slide_time);
        }
        else
        {
          for (i = start_brightness; i > end_brightness; i--)
          {
            lightChannels(i, channel_bits);
            if (i > end_brightness)
            {
              delay(increments1);
            }
          }
        }
      }
      else
      {
        float increments2 = slide_time / (end_brightness - start_brightness);
        if (slide_time <= 2 && end_brightness >= LOW_LUX)
        {
          toggleChannels(0, channel_bits);
          delay(slide_time);
        }
        else
        {

          for (i = start_brightness; i < end_brightness; i++)
          {
            lightChannels(i, channel_bits);
            if (i < end_brightness)
            {
              delay(increments2);
            }
          }
        }
      }
      // turn off after effect
      if (slide_time > 0 && auto_off == 1)
      {
        lightChannels(0, channel_bits);
      }
      unsigned long timeEnd = micros();
      double averageDuration = (double)((timeEnd - timeBegin) / 1000.0);
      // Serial.println(averageDuration);
    }
  }
}

void lightChannels(unsigned int lightVal, unsigned int channelBits)
{
  if ((channelBits & 1) == 1)
  {
    CH1 = lightVal;
  }
  if ((channelBits & 2) == 2)
  {
    CH2 = lightVal;
  }
  if ((channelBits & 4) == 4)
  {
    CH3 = lightVal;
  }
  if ((channelBits & 8) == 8)
  {
    CH4 = lightVal;
  }
  if ((channelBits & 16) == 16)
  {
    CH5 = lightVal;
  }
  if ((channelBits & 32) == 32)
  {
    CH6 = lightVal;
  }
  if ((channelBits & 64) == 64)
  {
    CH7 = lightVal;
  }
  if ((channelBits & 128) == 128)
  {
    CH8 = lightVal;
  }
}

void toggleChannels(unsigned int lightVal, unsigned int channelBits)
{
  if ((channelBits & 1) == 1)
  {
    digitalWrite(channel_1, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 2) == 2)
  {
    digitalWrite(channel_2, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 4) == 4)
  {
    digitalWrite(channel_3, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 8) == 8)
  {
    digitalWrite(channel_4, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 16) == 16)
  {
    digitalWrite(channel_5, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 32) == 32)
  {
    digitalWrite(channel_6, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 64) == 64)
  {
    digitalWrite(channel_7, (lightVal == 1) ? HIGH : LOW);
  }
  if ((channelBits & 128) == 128)
  {
    digitalWrite(channel_8, (lightVal == 1) ? HIGH : LOW);
  }
}

void resetStorage()
{
  channels_pos = 0;
  start_brightness_pos = 0;
  end_brightness_pos = 0;
  slide_time_pos = 0;
  auto_off_pos = 0;
  // Reset for the next message
  message_pos = 0;

  memset(channels, 0, sizeof(channels));
  memset(start_brightness_str, 0, sizeof(start_brightness_str));
  memset(end_brightness_str, 0, sizeof(end_brightness_str));
  memset(auto_off_str, 0, sizeof(auto_off_str));
  memset(slide_time_str, 0, sizeof(slide_time_str));
}

void zero_crosss_int() // function to be fired at the zero crossing to dim the light
{
  // Every zerocrossing interrupt: For 50Hz (1/2 Cycle) => 10ms ; For 60Hz (1/2 Cycle) => 8.33ms
  // 10ms=10000us , 8.33ms=8330us
  clock_tick = 0;
}

void timerIsr()
{
  clock_tick++;

  if (CH1 == clock_tick)
  {
    digitalWrite(channel_1, HIGH); // triac firing
  }

  if (CH2 == clock_tick)
  {
    digitalWrite(channel_2, HIGH); // triac firing
  }

  if (CH3 == clock_tick)
  {
    digitalWrite(channel_3, HIGH); // triac firing
  }

  if (CH4 == clock_tick)
  {
    digitalWrite(channel_4, HIGH); // triac firing
  }

  if (CH5 == clock_tick)
  {
    digitalWrite(channel_5, HIGH); // triac firing
  }

  if (CH6 == clock_tick)
  {
    digitalWrite(channel_6, HIGH); // triac firing
  }

  if (CH7 == clock_tick)
  {
    digitalWrite(channel_7, HIGH); // triac firing
  }

  if (CH8 == clock_tick)
  {
    digitalWrite(channel_8, HIGH); // triac firing
  }

  delayMicroseconds(8.33);

  if (CH1 == clock_tick)
  {
    digitalWrite(channel_1, LOW); // triac firing
  }

  if (CH2 == clock_tick)
  {
    digitalWrite(channel_2, LOW); // triac firing
  }

  if (CH3 == clock_tick)
  {
    digitalWrite(channel_3, LOW); // triac firing
  }

  if (CH4 == clock_tick)
  {
    digitalWrite(channel_4, LOW); // triac firing
  }

  if (CH5 == clock_tick)
  {
    digitalWrite(channel_5, LOW); // triac firing
  }

  if (CH6 == clock_tick)
  {
    digitalWrite(channel_6, LOW); // triac firing
  }

  if (CH7 == clock_tick)
  {
    digitalWrite(channel_7, LOW); // triac firing
  }

  if (CH8 == clock_tick)
  {
    digitalWrite(channel_8, LOW); // triac firing
  }
}
